const Brand = require("../models/Brand");
const mongoose = require("mongoose");

exports.createBrand = async (req, res) => {
  try {
    const { name, businessIds } = req.body;

    // Validate Business IDs
    const validBusinesses = await mongoose.connection.db
      .collection("businesses")
      .find({
        _id: { $in: businessIds.map((id) => new mongoose.Types.ObjectId(id)) },
      })
      .toArray();

    if (validBusinesses.length !== businessIds.length) {
      return res
        .status(400)
        .json({ message: "One or more business IDs are invalid" });
    }

    // Create Brand
    const newBrand = new Brand({ name, businessIds });
    await newBrand.save();

    res
      .status(201)
      .json({ message: "Brand created successfully", brand: newBrand });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getBrand = async (req, res) => {
  try {
    const { brandId } = req.params;

    // Fetch brand and count linked businesses
    const brand = await Brand.findById(brandId);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const businessCount = brand.businessIds.length; // Count of businesses in this brand

    res.status(200).json({ brand, businessCount });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
