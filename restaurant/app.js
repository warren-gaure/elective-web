/**
 * Le fichier principal du microservice des restaurants.
 * @author GAURE Warren
 * @version 1.0
*/

const express = require('express');
const cors = require('cors');

const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDoc = YAML.load('./swagger.yaml');
const restaurantRoutes = require('../restaurant/app/routers/restaurantRouter');


const loggerMiddleware = require('./app/middlewares/loggerMiddleware');
const authenticationMiddleware = require('./app/middlewares/authenticationMiddleware');

require("dotenv").config();

const app = express();

const port = process.env.RESTAURANT_PORT || 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(cors());

app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDoc));
app.use('/restaurants', restaurantRoutes);


app.use(loggerMiddleware);
app.use(authenticationMiddleware);

app.get('/hello', function(req, res) {
    res.send("Hello World !");
});

app.listen(port, function() {
    console.log(`Listens to port ${port}`);
});