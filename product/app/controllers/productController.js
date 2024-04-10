/**
 * Le contrôleur contenant la logique métier associée à chaque route de produits.
 * @author GAURE Warren
 * @version 1.0
*/

const axios = require('axios');
const mongoose = require('mongoose');
const productService = require('../services/productService');

const createAndAddProduct = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: "Required request body is missing" });
    }

    const token = req.headers.authorization.split(' ')[1];
    const userType = req.decoded.type;

    const name = req.body["name"];
    const description = req.body["description"];
    const price = req.body["price"];
    const image = req.body["image"];
    const isDrink = req.body["isDrink"];

    let restaurantID = req.body["restaurantID"];

    if (!name || !description || !price || !restaurantID || !image || !isDrink) {
        return res.status(400).json({ error: "Missing mandatory data to add a product" });
    }

    try {
        if (userType != "RESTAURANT") {
            throw new Error("Invalid user type");
        }

        restaurantID = new mongoose.Types.ObjectId(restaurantID);

        let url = `http://${process.env.RESTAURANT_HOST}:${process.env.RESTAURANT_PORT}/restaurant/find`;
        
        let response = await axios.get(url, {
            params: { id: restaurantID },
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status != 200) {
            throw new Error("Restaurant not found");
        }

        const product = await productService.createProduct(name, description, price, image, isDrink);

        url = url.replace('find', 'addProduct');
        response = await axios.post(url, { 
            restaurantID: restaurantID,
            product: product
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status != 201) {
            throw new Error("Product not added");
        }

        return res.status(201).json({ message: 'Product added successfully' });
    }
    catch (error) {
        if (error.message === "Invalid user type") {
            return res.status(403).json({ error: error.message });
        }
        else if (error.message === "Restaurant not found") {
            return res.status(404).json({ error: error.message });
        }
        else if (error.message === "Product not added") {
            return res.status(400).json({ error: error.message });
        }
        else {
            console.error("Unexpected error while adding a product : ", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
};

const findProduct = async (req, res) => {
    if (!req.query) {
        return res.status(400).json({ error: "Required query parameter is missing" });
    }

    const productID = req.query.id;

    if (!productID) {
        return res.status(400).json({ error: "Missing mandatory data" });
    }

    try {
        const product = await productService.findProductByID(productID);

        if (!product) {
            throw new Error("Product not found");
        }

        return res.status(200).json({ product });
    }
    catch (error) {
        if (error.message === "Product not found") {
            return res.status(404).json({ error: error.message });
        }
        else {
            console.error("Unexpected error while finding a product : ", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
};

const getProductsByIds = async (req, res) => {
    const productIds  = req.body["productIds"];

    if (!productIds || !Array.isArray(productIds)) {
        return res.status(400).json({ error: "Product IDs are missing or invalid" });
    }

    try {
        const productsInfo = await productService.getProductsByIds(productIds);

        if (productsInfo.length === 0) {
            throw new Error("No products found with the provided IDs");
        }

        return res.status(200).json({ productsInfo });
    }
    catch (error) {
        if (error.message === "No products found with the provided IDs") {
            return res.status(404).json({ error: "No products found with the provided IDs" });
        }
        else {
            console.error("Unexpected error while fetching products: ", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
};

const deleteProduct = async (req, res) => {
    if (!req.query) {
        return res.status(400).json({ error: "Required query parameter is missing" });
    }

    const productID = req.query.id;

    if (!productID) {
        return res.status(400).json({ error: "Missing mandatory data" });
    }

    try {
        await productService.deleteProductByID(productID);

        return res.status(200).json({ message: "Product deleted successfully" });
    }
    catch (error) {
        if (error.message === "Product not found") {
            return res.status(404).json({ error: error.message });
        }
        else {
            console.error("Unexpected error while deleting a product : ", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
};

const metrics = async (req, res) => {
    const userType = req.decoded.type;

    try {
        if (userType != "TECHNICAL") {
            throw new Error("Invalid user type");
        }

        const metrics = await productService.getPerformanceMetrics();

        return res.status(200).json({ metrics });
    }
    catch (error) {
        if (error.message === "Invalid user type") {
            res.status(403).json({ error: "Forbidden" });
        }
        else {
            console.error("Unexpected error while getting metrics : ", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
};

module.exports = {
    createAndAddProduct,
    findProduct,
    getProductsByIds,
    deleteProduct,
    metrics
};