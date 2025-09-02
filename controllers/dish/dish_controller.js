const pool = require("../../config/database");
const util = require("util");
// Util.promisify returns a promise instead of a callback.
const query = util.promisify(pool.query).bind(pool);
const promisePool = require("../../config/dbV2");

/**
 * For JSON response
 */
const { success, failure, created } = require("../../utils/response");

require("dotenv").config();
const env = process.env.env;

module.exports = {
  async addParentDish(req, res) {
    const { dish_name, description} = req.body;

    if (!dish_name) {
      return failure(res, "Dish name is required");
    }

    try {
      const sql = `
      INSERT INTO dish_master (dish_name, dish_type, description)
      VALUES (?, 'Parent', ?)
    `;
      const result = await query(sql, [dish_name, description]);
      return created(res, "Parent dish added successfully", {
        dish_id: result.insertId,
      });
    } catch (error) {
      console.error("Error adding parent dish:", error);
      return failure(res, "Failed to add parent dish", error);
    }
  },

  // Function to add a child dish
  async addChildDish(req, res) {
    const { dish_name, parent_dish_id, description, price } = req.body;

    if (!dish_name || !parent_dish_id) {
      return failure(res, "Dish name and parent dish ID are required");
    }

    try {
      const sql = `
      INSERT INTO dish_master (dish_name, dish_type, parent_dish_id, description, price)
      VALUES (?, 'Child', ?, ?, ?)
    `;
      const result = await query(sql, [
        dish_name,
        parent_dish_id,
        description,
        price,
      ]);
      return created(res, "Child dish added successfully", {
        dish_id: result.insertId,
      });
    } catch (error) {
      console.error("Error adding child dish:", error);
      return failure(res, "Failed to add child dish", error);
    }
  },

  async getAllParentDishes(req, res)  {
    try {
      const sql = `
        SELECT * FROM dish_master
        WHERE dish_type = 'Parent' AND is_active = 1
      `;
      const parentDishes = await query(sql);
  
      return success(res, "Parent dishes retrieved successfully", parentDishes);
    } catch (error) {
      console.error("Error retrieving parent dishes:", error);
      return failure(res, "Failed to retrieve parent dishes", error);
    }
  },
  
  // Function to get all child dishes for a specific parent dish
  async getChildDishesByParent (req, res) {
    const { parent_dish_id } = req.params;
  
    if (!parent_dish_id) {
      return validationFailed(res, "Parent dish ID is required");
    }
  
    try {
      const sql = `
        SELECT * FROM dish_master
        WHERE dish_type = 'Child' AND parent_dish_id = ? AND is_active = 1
      `;
      const childDishes = await query(sql, [parent_dish_id]);
  
      return success(res, `Child dishes for parent ID ${parent_dish_id} retrieved successfully`, childDishes);
    } catch (error) {
      console.error("Error retrieving child dishes:", error);
      return failure(res, "Failed to retrieve child dishes", error);
    }
},

async deleteDish  (req, res)  {
    const { dish_id } = req.params;
  
    if (!dish_id) {
      return validationFailed(res, "Dish ID is required");
    }
  
    try {
      const sql = `
        UPDATE dish_master
        SET is_active = 0
        WHERE dish_id = ?
      `;
      const result = await query(sql, [dish_id]);
  
      if (result.affectedRows === 0) {
        return failure(res, "Dish not found or already inactive", {});
      }
  
      return success(res, "Dish deleted (set to inactive) successfully", { dish_id });
    } catch (error) {
      console.error("Error deleting dish:", error);
      return failure(res, "Failed to delete dish", error);
    }
},

async updateChildDish(req, res) {
  const { child_dish_id } = req.params;
  const { dish_name, dish_description, dish_price } = req.body; 

  if (!child_dish_id) {
    return validationFailed(res, "Child dish ID is required");
  }

  if (!dish_name && !dish_description && !dish_price) {
    return validationFailed(
      res,
      "At least one field (dish_name, dish_description, dish_price) is required to update"
    );
  }

  try {
    const updates = [];
    const params = [];

    if (dish_name) {
      updates.push("dish_name = ?");
      params.push(dish_name);
    }

    if (dish_description) {
      updates.push("description = ?");
      params.push(dish_description);
    }

    if (dish_price) {
      updates.push("price = ?");
      params.push(dish_price);
    }

    const sql = `
      UPDATE dish_master
      SET ${updates.join(", ")}
      WHERE dish_id = ? AND dish_type = 'Child' AND is_active = 1
    `;
    params.push(child_dish_id);

    const result = await query(sql, params);

    if (result.affectedRows === 0) {
      return failure(res, "Child dish not found or update failed", {});
    }

    return success(res, "Child dish updated successfully", { child_dish_id });
  } catch (error) {
    console.error("Error updating child dish:", error);
    return failure(res, "Failed to update child dish", error);
  }
}


};
