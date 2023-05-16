const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint
//* Get all Tags and associated Product data (many-to-one)
router.get('/', async (req, res) => {
  try {
    const tagData = await Tag.findAll({
      include: [{
        model: Product,
        as: 'products',
        attributes: ['id', 'product_name'],
        through: {
          model: ProductTag,
          as: 'product_tag',
          attributes: ['id']
        }
      }]
    });
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get single tag by id with associated product data
// I have specified the through route in order to render the tag details but deliberately set the attributes of the ProductTag model to an empty array [] to prevent this redundant list of ids from showing in Insomnia:  {"product_tag": --> {"product_tag": {"id": 3, "product_id": 1, "tag_id": 8, "productId": 1, "tagId": 8	}
router.get('/:id', async (req, res) => {
  try {
    const tagData = await Tag.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          through: {
            ProductTag,
            attributes: []
          },
          as: 'products', attributes: ['id', 'product_name']
        },
      ]
    });

    if (!tagData) {
      res.status(404).json({ message: 'No tag found with that id!' });
      return;
    }

    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Create new tag
router.post('/', async (req, res) => {
  try {
    const tagData = await Tag.create(req.body);
    res.status(200).json(tagData);
  } catch (err) {
    res.status(400).json(err);
  }
});

// update a tag's name by its `id` value
router.put('/:id', async (req, res) => {
  try {
    const tagData = await Tag.update(req.body, {
      where: {
        id: req.params.id
      },
    });
    if (!tagData) {
      res.status(404).json({ message: 'No tag with this id!' });
      return;
    }
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// delete on tag by its `id` value
router.delete('/:id', async (req, res) => {
  try {
    const tagData = await Tag.destroy({
      where: {
        id: req.params.id
      },
    });

    if (!tagData) {
      res.status(404).json({ message: 'No tag card found with that id!' });
      return;
    }

    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
