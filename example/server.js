const Serless = require('../index');
const bodyParser = require('./middleware/body-parse').default;
// const bodyParser = require('body-parser');

let mockDB = {
  foods: [{ title: 'Pizza', price: 250 }]
};

const serless = new Serless();

serless.use(bodyParser());

serless
  .get('/', (req, res) => {
    res.send('Index Page');
  })
  .get('/home', (req, res) => {
    res.send('Home Page');
  });
serless
  .post('/products', (req, res) => {
    const { name, price } = JSON.parse(req.body);
    mockDB = Object.assign({}, mockDB, {
      foods: [
        ...mockDB.foods,
        {
          name,
          price
        }
      ]
    });
    res.send('Create products success');
  })
  .get('/products', (req, res) => {
    res.send(JSON.stringify(mockDB.foods));
  })
  .get('/products/:productId', (req, res) => {
    const { productId } = req.params;
    res.send('productId => ' + productId);
  });

serless.listen(3000, '127.0.0.1', () => console.log('run in 3000'));
