const router = require("express").Router();
const {
  addParentDish,
  addChildDish,
  getAllParentDishes,
  getChildDishesByParent,
  deleteDish,
  updateChildDish,
} = require("../../../controllers/dish/dish_controller");

router.post("/add-parent-dish", addParentDish);
router.post("/add-child-dish", addChildDish);
router.get("/get-parent-dishes", getAllParentDishes);
router.get("/get-child-dishes/:parent_dish_id", getChildDishesByParent);
router.delete("/delete-dish/:dish_id", deleteDish);
router.post("/update-dish/:child_dish_id", updateChildDish);

module.exports = router;
