const pool = require("../../config/database");
const promisePool = require("../../config/dbV2");
const { success, failure, created } = require("../../utils/response");
const { getCurrentTimeInIndia,convertToIST } = require('../../utils/timeUtils');

module.exports = {
    createOrder: async (req, res) => {
        const { table_id, order_items} = req.body;

        // Validate the payload
        if (!table_id || !Array.isArray(order_items) || order_items.length === 0) {
            return failure(res, "Invalid input: 'table_id' and 'order_items' are required.");
        }

        // Calculate total amount for the new order items
        const newOrderTotal = order_items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        const connection = await promisePool.getConnection();
        try {
            // Begin transaction
            await connection.beginTransaction();

            const existingOrderQuery = `
                SELECT order_id, total_amount 
                FROM orders 
                WHERE table_id = ? AND order_status = 'pending'
            `;
            const [existingOrder] = await connection.query(existingOrderQuery, [table_id]);

            let order_id;
            if (existingOrder.length > 0) {
                // Pending order exists, update total_amount
                order_id = existingOrder[0].order_id;
                const updatedTotalAmount = parseFloat(existingOrder[0].total_amount) + newOrderTotal;

                const updateOrderQuery = `
                    UPDATE orders 
                    SET total_amount = ? 
                    WHERE order_id = ?
                `;
                await connection.query(updateOrderQuery, [updatedTotalAmount, order_id]);
            } else {
                // No pending order, create a new one
                const newOrderQuery = `
                    INSERT INTO orders (table_id,  total_amount,  created_at, final_amount)
                    VALUES (?, ?, ?, ?)
                `;
                const [newOrderResult] = await connection.query(newOrderQuery, [
                    table_id,
                    newOrderTotal,
                    getCurrentTimeInIndia(),
                    newOrderTotal
                ]);
                order_id = newOrderResult.insertId;
            }

            // Prepare data for order_items table
            const orderItemsData = order_items.map(item => [
                order_id,
                item.dish_id,
                item.quantity,
                item.price,
                item.quantity * item.price
            ]);

            // Insert into order_items table
            const orderItemsInsertQuery = `
                INSERT INTO order_items (order_id, dish_id, quantity, price, total_price)
                VALUES ?
            `;
            await connection.query(orderItemsInsertQuery, [orderItemsData]);

            // Commit transaction
            await connection.commit();

            // Respond with success
            return created(res, {
                message: existingOrder.length > 0 
                    ? "Order updated with new items successfully." 
                    : "Order created successfully.",
                order_id,
                total_amount: existingOrder.length > 0 
                    ? parseFloat(existingOrder[0].total_amount) + newOrderTotal 
                    : newOrderTotal,
                order_items: orderItemsData.map(([order_id, dish_id, quantity, price, total_price]) => ({
                    dish_id,
                    quantity,
                    price,
                    total_price
                }))
            });
        } catch (error) {
           
            await connection.rollback();
            console.error(error);
            return failure(res, "Failed to process order.", error.message);
        } finally {
            connection.release();
        }
    },

    getPendingOrderItems: async (req, res) => {
        const { table_id } = req.params;

        // Validate the input
        if (!table_id) {
            return failure(res, "Invalid input: 'table_id' is required.");
        }

        const connection = await promisePool.getConnection();
        try {
            // Query to find pending orders for the given table_id
            const pendingOrderQuery = `
                SELECT o.order_id, o.total_amount , o.created_at, o.final_amount, o.discount
                FROM orders o 
                WHERE o.table_id = ? AND o.order_status = 'pending'
            `;
            const [pendingOrder] = await connection.query(pendingOrderQuery, [table_id]);

            if (pendingOrder.length === 0) {
                return success(res, {
                    message: "No pending orders found for this table.",
                    order_items: [],
                    total_amount: 0,
                    discount: 0,
                    final_amount: 0
                });
            }

            const order_id = pendingOrder[0].order_id;
            const total_amount = parseFloat(pendingOrder[0].total_amount);
            const created_at = convertToIST(pendingOrder[0].created_at);
            const discount = parseFloat(pendingOrder[0].discount);
            const final_amount = parseFloat(pendingOrder[0].final_amount);

            // Query to get order items for the pending order
            const orderItemsQuery = `
                SELECT 
                    oi.order_item_id,
                    oi.dish_id,
                    d.dish_name,
                    oi.quantity,
                    oi.price,
                    oi.total_price
                FROM order_items oi
                JOIN dish_master d ON oi.dish_id = d.dish_id
                WHERE oi.order_id = ?
            `;
            const [orderItems] = await connection.query(orderItemsQuery, [order_id]);

            return success(res, {
                message: "Pending order items fetched successfully.",
                order_items: orderItems,
                total_amount,
                created_at,
                discount,
                final_amount
            });
        } catch (error) {
            console.error(error);
            return failure(res, "Failed to fetch pending order items.", error.message);
        } finally {
            connection.release();
        }
    },


    addPaymentDetails: async (req, res) => {
        const { table_id, discount, final_amount, payment_methods, due_details } = req.body;
    
        const connection = await promisePool.getConnection();
    
        try {
            await connection.beginTransaction();
    
            // Retrieve the order_id for the given table_id with order_status as "pending"
            const [[order]] = await connection.query(
                "SELECT order_id FROM orders WHERE table_id = ? AND order_status = ?",
                [table_id, "pending"]
            );
    
            if (!order) {
                throw new Error("No pending order found for the specified table.");
            }
    
            const { order_id } = order;
    
            // Update the orders table
            const [orderUpdateResult] = await connection.query(
                "UPDATE orders SET order_status = ?, discount = ?, final_amount = ? WHERE order_id = ?",
                ["completed", discount, final_amount, order_id]
            );
    
            if (orderUpdateResult.affectedRows === 0) {
                throw new Error("Order not found or could not be updated.");
            }
    
            // Handle payments
            const paymentPromises = payment_methods.map(async (payment) => {
                const { method, amount, transaction_id } = payment;
    
                if (method === "due" && due_details) {
                    const { customer_name, mobile_number } = due_details;
                    await connection.query(
                        `INSERT INTO dues_master (order_id, customer_name, mobile_number, total_amount, paid_amount) \
                        VALUES (?, ?, ?, ?, ?)`,
                        [order_id, customer_name, mobile_number, final_amount, final_amount - amount]
                    );
                } else {
                    await connection.query(
                        `INSERT INTO payments (order_id, payment_method, amount_paid, transaction_id) \
                        VALUES (?, ?, ?, ?)`,
                        [order_id, method, amount, transaction_id]
                    );
                }
            });
    
            await Promise.all(paymentPromises);
    
            // Fetch updated order data
            const [[updatedOrder]] = await connection.query(
                "SELECT * FROM orders WHERE order_id = ?",
                [order_id]
            );
    
            // Response with structured data
            const responsePayments = payment_methods.map(({ method, amount, transaction_id }) => ({
                payment_method: method,
                amount_paid: amount,
                transaction_id
            }));
    
            const responseDue = payment_methods.some(pm => pm.method === "due")
                ? {
                    customer_name: due_details.customer_name,
                    mobile_number: due_details.mobile_number,
                    total_amount: final_amount,
                    paid_amount: final_amount - responsePayments.find(pm => pm.payment_method === "due").amount,
                    due_amount: responsePayments.find(pm => pm.payment_method === "due").amount
                }
                : null;
    
            await connection.commit();
    
            return created(res, {
                message: "Payment processed successfully.",
                order_id: updatedOrder.order_id,
                discount: updatedOrder.discount,
                final_amount: updatedOrder.final_amount,
                order_status: updatedOrder.order_status,
                payments: responsePayments,
                due_details: responseDue
            });
        } catch (error) {
            await connection.rollback();
            console.error(error);
            return failure(res, "Failed to process payment.", error.message);
        } finally {
            connection.release();
        }
    },


    getOrderDetails: async (req, res) => {
        const { startDate, endDate } = req.body;

    // Parse and adjust startDate
    const adjustedStartDate = new Date(startDate || new Date());
    adjustedStartDate.setHours(0, 0, 0, 0); // Set time to 00:00:00

    // Parse and adjust endDate
    const adjustedEndDate = new Date(endDate || new Date());
    adjustedEndDate.setHours(23, 59, 59, 999); // Set time to 23:59:59
        const defaultStart = new Date();
        defaultStart.setHours(0, 0, 0, 0);
        const defaultEnd = new Date();
        defaultEnd.setHours(23, 59, 59, 999);
    
        const filters = {
          startDate: convertToIST( adjustedStartDate.toISOString()) || convertToIST(defaultStart.toISOString()),
          endDate: convertToIST(adjustedEndDate.toISOString())  || convertToIST(defaultEnd.toISOString()),
        };
        try {
          const [summary] = await promisePool.query(`
            SELECT 
  SUM(CASE WHEN p.payment_method = 'cash' THEN p.amount_paid ELSE 0 END) AS total_cash,
  SUM(CASE WHEN p.payment_method = 'upi' THEN p.amount_paid ELSE 0 END) AS total_upi,
  SUM(CASE WHEN p.payment_method = 'card' THEN p.amount_paid ELSE 0 END) AS total_card,
  SUM(p.amount_paid) AS total_collection,
  (
    SELECT SUM(due_amount)
    FROM (
      SELECT DISTINCT d.order_id, d.due_amount
      FROM dues_master d
      JOIN orders o ON o.order_id = d.order_id
      WHERE o.created_at BETWEEN ? AND ?
    ) AS distinct_due_amounts
  ) AS total_due
FROM orders o
LEFT JOIN payments p ON o.order_id = p.order_id
WHERE o.created_at BETWEEN ? AND ?;


          `, [filters.startDate, filters.endDate, filters.startDate, filters.endDate]);
    
          const [orders] = await promisePool.query(`
            SELECT 
    o.order_id,
    o.table_id,
    o.total_amount,
    o.discount,
    o.final_amount,
    o.created_at,
    t.table_name,
    (
        SELECT SUM(p_sub.amount_paid)
        FROM payments p_sub
        WHERE p_sub.order_id = o.order_id
    ) AS paid_amount,
    IFNULL(
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'dish_name', dm.dish_name,
                'quantity', oi.quantity,
                'price', oi.price,
                'total_price', oi.total_price
            )
        ), '[]'
    ) AS order_items,
    IFNULL(
        JSON_OBJECT(
            'due_amount', d.due_amount,
            'customer_name', d.customer_name,
            'mobile_number', d.mobile_number
        ), '{}'
    ) AS due_details
FROM orders o
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN dish_master dm ON oi.dish_id = dm.dish_id
LEFT JOIN dues_master d ON o.order_id = d.order_id
LEFT JOIN table_master t ON o.table_id = t.table_id
WHERE o.created_at BETWEEN ? AND ?
GROUP BY o.order_id;
          `, [filters.startDate, filters.endDate]);
    
          // Fetch payments separately grouped by order_id
          const [payments] = await promisePool.query(`
            SELECT 
              o.order_id,
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'payment_method', p.payment_method,
                  'amount_paid', p.amount_paid,
                  'transaction_id', p.transaction_id
                )
              ) AS payments
            FROM orders o
            LEFT JOIN payments p ON o.order_id = p.order_id
            WHERE o.created_at BETWEEN ? AND ?
            GROUP BY o.order_id
          `, [filters.startDate, filters.endDate]);
    
          // Map payments by order_id for quick access
          const paymentMap = payments.reduce((map, payment) => {
            map[payment.order_id] = payment.payments || [];
            return map;
          }, {});
    
          // Format orders and attach payments
          const formattedOrders = orders.map(order => ({
            order_id: order.order_id,
            table_id: order.table_id,
            total_amount: order.total_amount,
            discount: order.discount,
            final_amount: order.final_amount,
            created_at: convertToIST(order.created_at),
            table_name: order.table_name,
            paid_amount: order.paid_amount,
            order_items: JSON.parse(order.order_items || '[]'),
            payments: paymentMap[order.order_id] || [],
            due_details: JSON.parse(order.due_details || '{}'),
          }));
    
          return res.status(200).json({
            success: true,
            message: "Order details fetched successfully",
            data: {
              summary,
              orders: formattedOrders,
            },
          });
        } catch (error) {
          console.error("Error fetching order details:", error);
          return res.status(500).json({
            success: false,
            message: "Error fetching order details",
            error: error.message,
          });
        }
      },

      payDueAmount: async (req, res) => {
        const { customerName, mobileNumber, paymentMethod, paymentAmount } = req.body;
      
        try {
          if (!customerName && !mobileNumber) {
            return failure(res, "Customer name or mobile number is required.");
          }
      
          if (!paymentMethod || !["cash", "card", "upi"].includes(paymentMethod)) {
            return failure(res, "Invalid payment method. Choose from 'cash', 'card', or 'upi'.");
          }
      
          if (!paymentAmount || paymentAmount <= 0) {
            return failure(res, "Payment amount must be greater than 0.");
          }
      
          // Fetch the due based on customer name or mobile number
          const query = `
            SELECT * FROM dues_master 
            WHERE (customer_name = ? OR mobile_number = ?) AND due_status = 'pending'
            ORDER BY updated_at LIMIT 1
          `;
          const [due] = await promisePool.query(query, [customerName, mobileNumber]);
      
          if (due.length === 0) {
            return failure(res, "No pending dues found for the given customer.");
          }
      
          const dueEntry = due[0];
      
          // Validate if payment amount is greater than the due amount
          if (paymentAmount > parseFloat(dueEntry.due_amount)) {
            return failure(res, "Payment amount cannot exceed the due amount.");
          }
      
          const remainingDue = parseFloat(dueEntry.due_amount) - parseFloat(paymentAmount);
      
          // Start transaction
          const connection = await promisePool.getConnection();
          await connection.beginTransaction();
      
          // Add payment entry to payments table
          const paymentQuery = `
            INSERT INTO payments (order_id, payment_method, amount_paid, payment_date, transaction_id)
            VALUES (?, ?, ?, ?, ?)
          `;
          const currentTime = getCurrentTimeInIndia();
          await connection.query(paymentQuery, [
            dueEntry.order_id,
            paymentMethod,
            paymentAmount,
            currentTime,
            paymentMethod === "upi" ? `UPI${Date.now()}` : null
          ]);
      
          // Update dues_master table
          if (remainingDue <= 0) {
            const updateDueQuery = `
              UPDATE dues_master 
              SET paid_amount = total_amount, due_status = 'completed', updated_at = ?
              WHERE due_id = ?
            `;
            await connection.query(updateDueQuery, [currentTime, dueEntry.due_id]);
          } else {
            const updatePartialDueQuery = `
              UPDATE dues_master 
              SET paid_amount = paid_amount + ?, updated_at = ?
              WHERE due_id = ?
            `;
            await connection.query(updatePartialDueQuery, [
              paymentAmount,
              currentTime,
              dueEntry.due_id
            ]);
          }
      
          // Commit transaction
          await connection.commit();
          connection.release();
      
          return success(res, "Payment processed successfully.");
        } catch (error) {
          console.error("Error processing payment:", error);
          if (connection) await connection.rollback();
          return failure(res, "Failed to process payment. Please try again.");
        }
      },


  getPendingDues: async (req, res) => {
    try {
      // Query to fetch pending dues
      const query = `
        SELECT customer_name, mobile_number, due_amount, created_at 
        FROM dues_master 
        WHERE due_status = 'pending'
        ORDER BY created_at DESC
      `;

      // Execute the query
      const [results] = await promisePool.query(query);

      if (results.length === 0) {
        return success(res, "No pending dues found.", []);
      }

      // Convert `created_at` to IST for all results
      const formattedResults = results.map(due => ({
        ...due,
        created_at: convertToIST(due.created_at)
      }));

      return success(res, "Pending dues retrieved successfully.", formattedResults);
    } catch (error) {
      console.error("Error fetching pending dues:", error);
      return failure(res, "Failed to fetch pending dues. Please try again.");
    }
  },

  getAllPendingOrders: async (req, res) => {
    try {
      const sqlQuery = `
        SELECT table_id, total_amount 
        FROM orders 
        WHERE order_status = 'pending'
      `;
      const [pendingOrders] = await promisePool.query(sqlQuery);

      if (pendingOrders.length === 0) {
        return success(res, "No pending orders found.", []);
      }

      return success(res, "Pending orders retrieved successfully.", pendingOrders);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      return failure(res, "Failed to retrieve pending orders. Please try again later.");
    }
  },

  deletePendingOrder: async (req, res) => {
    try {
      const { table_id } = req.body;
console.log(table_id);
      if (!table_id) {
        return failure(res, "Table ID is required.");
      }

      // Check if the order exists and is pending
      const checkQuery = `
        SELECT * FROM orders 
        WHERE table_id = ? AND order_status = 'pending'
      `;
      const existingOrder = await promisePool.query(checkQuery, [table_id]);

      if (existingOrder.length === 0) {
        return failure(res, "No pending order found for the given Table ID.");
      }

      // Delete the pending order
      const deleteQuery = `
        DELETE FROM orders 
        WHERE table_id = ? AND order_status = 'pending'
      `;
      await promisePool.query(deleteQuery, [table_id]);

      return success(res, "Pending order deleted successfully.");
    } catch (error) {
      console.error("Error deleting pending order:", error);
      return failure(res, "Failed to delete pending order. Please try again later.");
    }
  }
};


