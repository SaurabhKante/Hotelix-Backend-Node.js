const { createOrder, getPendingOrderItems, addPaymentDetails, getOrderDetails, payDueAmount, getPendingDues, getAllPendingOrders, deleteOrderByTableId, deletePendingOrder } = require("../../../controllers/order/order_controller");

const router = require("express").Router();


router.post("/create-order", createOrder);
router.post("/add-payments", addPaymentDetails);
router.get("/get-order/:table_id", getPendingOrderItems);
router.get("/get-dues", getPendingDues);
router.get("/get-amount", getAllPendingOrders);
router.post("/get-order-details", getOrderDetails);
router.post("/pay-dues", payDueAmount);
router.post("/delete-order", deletePendingOrder);


module.exports = router;
