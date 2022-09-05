import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsDto, ProductPaginator } from './dto/get-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetPopularProductsDto } from './dto/get-popular-products.dto';
import { GetSalesProductsDto } from './dto/get-sales-products.dto';
import { Product } from './entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Tag } from 'src/tags/entities/tag.entity';
import { Manufacturer } from 'src/manufacturers/entities/manufacturer.entity';
import { Attribute } from 'src/attributes/entities/attribute.entity';
import { AttributeValue } from 'src/attributes/entities/attribute-value.entity';
import { paginate } from 'src/common/pagination/paginate';
import productsJson from '@db/products.json';
import categoriesJson from '@db/categories.json';
import tagsJson from 'src/tags/tags.json';
import attributesJson from '@db/attributes.json';
import manufacturersJson from 'src/manufacturers/manufacturers.json';
import Fuse from 'fuse.js';
import * as admin from 'firebase-admin';

const products = plainToClass(Product, productsJson);
const categories = plainToClass(Category, categoriesJson);
const tags = plainToClass(Tag, tagsJson);
const attributes = plainToClass(Attribute, attributesJson);
const manufacturers = plainToClass(Manufacturer, manufacturersJson);

const options = {
  keys: [
    'name',
    'type.slug',
    'categories.slug',
    'status',
    'shop_id',
    'author.slug',
    'tags',
    'manufacturer.slug',
  ],
  threshold: 0.3,
};

const fuse = new Fuse(products, options);

/*  var firestore = admin.firestore();
  var batch = firestore.batch();

  for(var myKey in productsJson) {
    var myKeyRef = firestore.collection('products').doc(myKey);
    batch.set(myKeyRef, productsJson[myKey]);
  }
  batch.commit().then(function () {
    return {
      success: true,
      message: 'Batch Successful',
    };
  }); */

@Injectable()
export class ProductsService {
  private products = products;
  private categories: Category[] = categories;
  private tags: Tag[] = tags;
  private attributes: Attribute[] = attributes;
  private manufacturers: Manufacturer[] = manufacturers;

  async create(createProductDto: CreateProductDto) {

    const data = JSON.stringify(createProductDto);
    const obj = JSON.parse(data);

    const mdb = admin.database();


  //  const db = admin.firestore();
    let result;

    let catArr = obj.categories;
    let subCarArr = obj.sub_categories;
  //  let tagArr = obj.tags;
    let catList = [];
    let subCatList = [];
  //  let tagsList = [];
    let variations = [];
    let variation_options = [];

    //console.log("CATS: " + JSON.stringify(catArr));


    let product_slug = obj.name.toLowerCase().replaceAll(" ", "-");
    let product_type = {
      id: 1,
      name: "Grocery",
      settings: {
        isHome: true,
        layoutType: "modern",
        productCard: "neon"
      },
      slug: "grocery",
      icon: "FruitsVegetable",
      promotional_sliders: []
    };

  /*  await catArr.forEach((item) => {
      const catData = this.categories.find((p) => p.slug === item);
      let dItem = {
        id: catData.id,
        name: catData.name,
        slug: catData.slug,
        parent: catData.parent,
        type_id: 1
      }
      catList.push(dItem);
    });*/

    const catData = this.categories.find((p) => p.slug === obj.categories);
    if(catData !== undefined) {
      //console.log(`CATS DATA: ${index} ${JSON.stringify(catData)}`);
      let dItem = {
        id: catData.id,
        name: catData.name,
        slug: catData.slug,
        parent: catData.parent,
        type_id: 1
      }
      catList.push(dItem);
    }

    const manuData = this.manufacturers.find((m) => m.id === obj.manufacturer_id);
    let mItem = {
      id: manuData.id,
      name: manuData.name,
      slug: manuData.slug,
      is_approved: true
    }

    await subCarArr.forEach((item, index) => {
      let name = '';
      let id = 2 + index;
      if(item.includes("-")) {
        const newName = item.replaceAll("-", " ");
        const arrStr = newName.split(" ");
        for (var i = 0; i < arrStr.length; i++) {
            arrStr[i] = arrStr[i].charAt(0).toUpperCase() + arrStr[i].slice(1);
        }

        const str2 = arrStr.join(" ");
        name = str2;
      }
      else {
        name = item.charAt(0).toUpperCase() + item.slice(1);
      }

      let dItem = {
        id: id,
        name: name,
        slug: item,
        parent: null,
        type_id: 1
      }
      catList.push(dItem);
      subCatList.push(dItem);
    });

/*    await tagArr.forEach((item) => {
      const tagData = this.tags.find((p) => p.id === Number(item));
      let tItem = {
        id: tagData.id,
        name: tagData.name,
        slug: tagData.slug,
        icon: tagData.icon,
        type_id: 1
      }

      tagsList.push(tItem);

    }); */

    if(obj.variations.length < 1) {
      delete obj.variation_options;
    }
    else {
      let varOptions = obj.variation_options;
      let varsArr = obj.variations;
      variation_options = varOptions.upsert;

      let valuesArr = [];

      await varsArr.forEach((item, index) => {
        const variationsData = this.attributes.find((attr) => {
          return attr.values.find((v) => {
            return v.id === item.attribute_value_id;
          });
        });
        const variationsArray = variationsData.values;
        const variationsArrayData = variationsArray.find((v) => v.id === item.attribute_value_id);
        valuesArr.push(variationsArrayData);

        let variationsItem = {
          id: variationsArrayData.id,
          attribute_id: variationsData.id,
          value: variationsArrayData.value,
          meta: variationsArrayData.meta,
          created_at: variationsArrayData.created_at,
          updated_at: variationsArrayData.updated_at,
          attribute: {
            id: variationsData.id,
            slug: variationsData.slug,
            name: variationsData.name
          },
          values: valuesArr
        }

        variations.push(variationsItem);

      });

      obj.variation_options = variation_options;
      obj.variations = variations;
    }

    if(!obj.sale_price) {
      obj.sale_price = null;
    }

    obj.categories = catList;
    obj.sub_categories = subCatList;
  //  obj.tags = tagsList;

    delete obj.manufacturer_id;
  //  delete obj.sub_categories;
//    console.log("ALL: " + JSON.stringify(resultObj));

    try {
        //const docRef = db.collection('products');
        const docRef = mdb.ref("products");
        //  const slug = createProductDto.name;
        //  await docRef.set(resultObj)

        const newPostRef = docRef.push();
        const postId = newPostRef.key;

        let resultObj = {...obj, id: postId, slug: product_slug, type: product_type, manufacturer: mItem, in_stock: true};
        await newPostRef.set(resultObj, (error) => {
          if (error) {
             console.log('Data could not be saved.' + error);
           } else {
             console.log('Data saved successfully.');
           }
        });
    /*  await docRef.add(resultObj)
        .then(async(res) => {
          await docRef.doc(res.id).update({
            id: res.id
          })
        })
        .catch(console.error);*/

      } catch (e) {
        throw e;
      }

      return {
        success: true,
        message: 'Product created successful',
      };

  }

  async getProducts({ limit, page, search }: GetProductsDto): Promise<ProductPaginator> {
    const moptions = {
      keys: [
        'name',
        'type.slug',
        'categories.slug',
        'status',
        'tags',
        'manufacturer.slug',
      ],
      threshold: 0.3,
    };
  //  const db = admin.firestore();
  //  const docRef = db.collection('products');

    const mdb = admin.database();
    const ref = mdb.ref("products");


    let results;
    let url;
    let data = [];
    //let data: Product[] = this.products;
    if (!page) page = 1;
    if (!limit) limit = 30;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    //let data: Product[] = this.products;
/*    const snapshot = await docRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          data.push(doc.data());
        });
    });*/

    await ref.once("value", function(snapshot) {
      const response = snapshot.val();
      Object.entries(response).forEach(entry => {
        const [key, value] = entry;
        let mObj = JSON.parse(JSON.stringify(value));
        let newObj = { ...mObj, id: key }

        data.push(newObj);
      });
    });

    const mfuse = new Fuse(data, moptions);

    if (search) {
      const parseSearchParams = search.split(';');
      for (const searchParam of parseSearchParams) {
        const [key, value] = searchParam.split(':');
        // TODO: Temp Solution
        if (key !== 'slug') {
          data = fuse.search(value)?.map(({ item }) => item);
        }
      }
    }

    results = data.slice(startIndex, endIndex);
    url = `/products?search=${search}&limit=${limit}`;
    // if (status) {
    //   data = fuse.search(status)?.map(({ item }) => item);
    // }
    // if (text?.replace(/%/g, '')) {
    //   data = fuse.search(text)?.map(({ item }) => item);
    // }
    // if (hasType) {
    //   data = fuse.search(hasType)?.map(({ item }) => item);
    // }
    // if (hasCategories) {
    //   data = fuse.search(hasCategories)?.map(({ item }) => item);
    // }

    // if (shop_id) {
    //   data = this.products.filter((p) => p.shop_id === Number(shop_id));
    // }

  //  console.log("GET ALL PRODUCTS !");

    return {
      data: results,
      ...paginate(data.length, page, limit, results.length, url),
    };
  }

  async getPopularProducts({ limit, type_slug }: GetPopularProductsDto): Promise<Product[]> {

    let data = [];
  //  let data: Product[] = this.products;

    //  const db = admin.firestore();
    //  const docRef = db.collection('products');

    const mdb = admin.database();
    const ref = mdb.ref("products");

/*    const snapshot = await docRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          data.push(doc.data());
        });
    }); */


    await ref.once("value", function(snapshot) {
      const response = snapshot.val();
      Object.entries(response).forEach(entry => {
        const [key, value] = entry;
        let mObj = JSON.parse(JSON.stringify(value));
        let newObj = { ...mObj, id: key }

        data.push(newObj);
      });
    });

    const fuse = new Fuse(data, options);

    if (type_slug) {
      data = fuse.search(type_slug)?.map(({ item }) => item);
    }
    return data?.slice(0, limit);
  }

  async getProductBySlug(slug: string): Promise<Product> {
  //  const db = admin.firestore();
  //  const docRef = db.collection('products');

    const mdb = admin.database();
    const ref = mdb.ref("products");

    const moptions = {
      keys: [
        'type.slug',
      ],
      threshold: 0.0,
    };

    let results;
    let related_products;
    let data = [];
  //  let data: Product[] = this.products;
    let product;

    /*const snapshot = await docRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          data.push(doc.data());

        });
    }); */

    await ref.once("value", function(snapshot) {
      const response = snapshot.val();
      Object.entries(response).forEach(entry => {
        const [key, value] = entry;
        let mObj = JSON.parse(JSON.stringify(value));
        let newObj = { ...mObj, id: key }

        data.push(newObj);
      });
    });

    const mfuse = new Fuse(data, moptions);

    product = data.find((p) => p.slug === slug);
    //console.log("PRODUCT DATA:" + JSON.stringify(data[0].type.slug));

    results = mfuse.search(product.type.slug)?.map(({ item }) => item);

    related_products = results.slice(0, 20);

    return {
      ...product,
      related_products,
    };
  }

  async getSalesProducts({ limit, type_slug }: GetSalesProductsDto): Promise<Product[]> {

    let data = [];
  //  let data: Product[] = this.products;
    //  const db = admin.firestore();
    //  const docRef = db.collection('products');

    const mdb = admin.database();
    const ref = mdb.ref("products");

  await ref.once("value", function(snapshot) {
    const response = snapshot.val();
    Object.entries(response).forEach(entry => {
      const [key, value] = entry;
      let mObj = JSON.parse(JSON.stringify(value));
      let newObj = { ...mObj, id: key }

      data.push(newObj);
    });
  });

    let result = data.filter((p) => p.price > p.sale_price && p.sale_price !== null);
    const fuse = new Fuse(data, options);

    if (type_slug) {
      result = fuse.search(type_slug)?.map(({ item }) => item);
    }
    return result?.slice(0, limit);
  }

  async getProductsByCategory(categories_slug: string): Promise<Product[]> {

    //  const db = admin.firestore();
    //  const docRef = db.collection('products');

    const mdb = admin.database();
    const ref = mdb.ref("products");


      const moptions = {
        keys: [
          'categories.slug',
        ],
        threshold: 0.0,
      };

    let data = [];
    let mData = [];
    let results;

    await ref.once("value", function(snapshot) {
      const response = snapshot.val();
      Object.entries(response).forEach(entry => {
        const [key, value] = entry;
        let mObj = JSON.parse(JSON.stringify(value));
        let newObj = { ...mObj, id: key }

        data.push(newObj);
      });
    });

    const mfuse = new Fuse(data, moptions);


    results = mfuse.search(categories_slug)?.map(({ item }) => item);

    return results;
  }

 async update(id: string, updateProductDto: UpdateProductDto) {
  //  console.log("PRODUCTS UPDATE: ", JSON.stringify(updateProductDto));
    const data = JSON.stringify(updateProductDto);
    const obj = JSON.parse(data);

  //  console.log("PRODUCTS UPDATE: ", obj);
    let result = false;

    const mdb = admin.database();
    const ref = mdb.ref("products");


    let catArr = obj.categories;
    let subCarArr = obj.sub_categories;
    let tagArr = [];
    let catList = [];
    let subCatList = [];
    let variations = [];
    let variation_options = [];

    let product_slug = obj.name.toLowerCase().replaceAll(" ", "-");

  //  console.log("TAGS: " + JSON.stringify(obj.tags));
//    console.log("CATS: " + JSON.stringify(catArr));

    const catData = this.categories.find((p) => p.slug === obj.categories);
    if(catData !== undefined) {
      //console.log(`CATS DATA: ${index} ${JSON.stringify(catData)}`);
      let dItem = {
        id: catData.id,
        name: catData.name,
        slug: catData.slug,
        parent: catData.parent,
        type_id: 1
      }
      catList.push(dItem);
    }

    const manuData = this.manufacturers.find((m) => m.id === obj.manufacturer_id);
    let mItem = {
      id: manuData.id,
      name: manuData.name,
      slug: manuData.slug,
      is_approved: true
    }
    //manuList.push(mItem);

    /*await catArr.forEach((item, index) => {
      const catData = this.categories.find((p) => p.slug === item);
      console.log(`CATS DATA: ${index} ${JSON.stringify(catData)}`);
      let dItem = {
        id: catData.id,
        name: catData.name,
        slug: catData.slug,
        parent: catData.parent,
        type_id: 1
      }
      catList.push(dItem);
    });*/

    await subCarArr.forEach((item, index) => {
      let name = '';
      let id = 2 + index;
      if(item.includes("-")) {
        const newName = item.replaceAll("-", " ");
        const arrStr = newName.split(" ");
        for (var i = 0; i < arrStr.length; i++) {
            arrStr[i] = arrStr[i].charAt(0).toUpperCase() + arrStr[i].slice(1);
        }

        const str2 = arrStr.join(" ");
        name = str2;
      }
      else {
        name = item.charAt(0).toUpperCase() + item.slice(1);
      }

      let dItem = {
        id: id,
        name: name,
        slug: item,
        parent: null,
        type_id: 1
      }
      catList.push(dItem);
      subCatList.push(dItem);
    });

  //  tagArr = obj.tags.split(',');

  /*  await tagArr.forEach((item) => {
      const tagData = this.tags.find((p) => p.id === Number(item));
      let tItem = {
        id: tagData.id,
        name: tagData.name,
        slug: tagData.slug,
        icon: tagData.icon,
        type_id: 1
      }

      tagsList.push(tItem);

    }); */

    /*
    delete obj.variation_options;
    }
    else {

    */

    if(obj.variations.length < 1) {
      delete obj.variation_options;
    }

    else {
      let varOptions = obj.variation_options;
      let varsArr = obj.variations;
      variation_options = varOptions.upsert;

      let valuesArr = [];

      await varsArr.forEach((item, index) => {
        const variationsData = this.attributes.find((attr) => {
          return attr.values.find((v) => {
            return v.id === item.attribute_value_id;
          });
        });
        const variationsArray = variationsData.values;
        const variationsArrayData = variationsArray.find((v) => v.id === item.attribute_value_id);
        valuesArr.push(variationsArrayData);

        let variationsItem = {
          id: variationsArrayData.id,
          attribute_id: variationsData.id,
          value: variationsArrayData.value,
          meta: variationsArrayData.meta,
          created_at: variationsArrayData.created_at,
          updated_at: variationsArrayData.updated_at,
          attribute: {
            id: variationsData.id,
            slug: variationsData.slug,
            name: variationsData.name
          },
          values: valuesArr
        }

        variations.push(variationsItem);

      });

      obj.variation_options = variation_options;
      obj.variations = variations;
    }

    if(!obj.sale_price) {
      obj.sale_price = null;
    }

  //  console.log("TAGS LIST: " + JSON.stringify(tagsList));

    obj.categories = catList;
    obj.sub_categories = subCatList;
  //  obj.tags = tagArr;

    delete obj.manufacturer_id;
  //  console.log("PRODUCT FULL: " + JSON.stringify(obj));

    let resultObj = {...obj, slug: product_slug, manufacturer: mItem, in_stock: true};

    //const docRef = admin.firestore().collection('products').doc(id);
    const docRef = ref.child(id);
    await docRef.update(resultObj)
    .then(() => {
      console.log('Write succeeded!');
      result = true;
    });

    return {
      success: true,
      message: 'Product successfully updated',
    };
  }

  async remove(id: string) {
    //return `This action removes a #${id} product`;
    //console.log("ID: " + id);
    const mdb = admin.database();
    const ref = mdb.ref("products");

    const docRef = ref.child(id);

   //const docRef = admin.firestore().collection('products').doc(id);
    await docRef.remove();
    return {
      success: true,
      message: 'Product successfully deleted!',
    };
  }
}

/*
getProductByCategory(category: string): Product[] {
  const products = this.products.filter((p) => p.categories.includes(category));
  return products;
}
*/
