const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

//*Get all products with associated Category & Tag data
router.get('/', async (req, res) => {
  try {
    const productData = await Product.findAll({
      include: [{ model: Category }, { model: Tag, as: 'tags', attributes: ["id", "tag_name"], through: { attributes: [] } }],
      // attributes: { exclude: ["product_tag"] }
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

//* Get one product by id; include associated Category & Tag data
// I have specified the through route in order to render the tag details but deliberately set the attributes of the ProductTag model to an empty array [] to prevent this redundant list from showing  in Insomnia:  --> "product_tag": {"id": 5, "product_id": 3, "tag_id": 1, "productId": 3,  "tagId": 1}

router.get('/:id', async (req, res) => {
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [
        { model: Category },
        {
          model: Tag,
          through: {
            model: ProductTag,
            attributes: []
          },
          as: 'tags', attributes: ['id', 'tag_name']
        }
      ]
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with that id!' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create new product
router.post('/', (req, res) => {
  Product.create(req.body)
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      } else {
        // if no product tags, just respond
        res.status(200).json(product);
      }
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

//* UPDATE PRODUCT
router.put("/:id", async (req, res) => {
  try {
    console.log("Updating by Id")
    const productData = await Product.update(req.body, {
      where: {
        id: req.params.id
      },
    });
    if (!req.body.tagIds) {
      res.json(productData)
      return
    }
    const productTags = await ProductTag.findAll({ where: { product_id: req.params.id } });
    const productTagIds = productTags.map(({ tag_id }) => tag_id);
    const newProductTags = req.body.tagIds
      .filter((tag_id) => !productTagIds.includes(tag_id))
      .map((tag_id) => {
        return {
          product_id: req.params.id,
          tag_id,
        };
      });
    const productTagsToRemove = productTags
      .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
      .map(({ id }) => id);
    const updatedProductTags = await Promise.all([
      ProductTag.destroy({ where: { id: productTagsToRemove } }),
      ProductTag.bulkCreate(newProductTags),
    ]);
    res.json(updatedProductTags)
  } catch (error) {
    console.log(error)
    res.status(400).json(error)
  }
})

// delete one product by its `id` value
router.delete('/:id', async (req, res) => {
  try {
    const productData = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with that id!' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
