/**
 * Le fichier principal du microservice des livraisons.
 * @author GAURE Warren
 * @version 1.0
*/

require("dotenv").config();

const app = require('../shared/config/appConfig');

const port = process.env.DELIVERY_PORT || 3006;

app.get('/hello', function(req, res) {
    res.send("Hello World !");
});

app.listen(port, function() {
    console.log(`Listens to port ${port}`);
});