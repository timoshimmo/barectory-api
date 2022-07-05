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
import { paginate } from 'src/common/pagination/paginate';
import productsJson from '@db/products.json';
import categoriesJson from '@db/categories.json';
import tagsJson from 'src/tags/tags.json';
import Fuse from 'fuse.js';
import * as admin from 'firebase-admin';

const products = plainToClass(Product, productsJson);
const categories = plainToClass(Category, categoriesJson);
const tags = plainToClass(Tag, tagsJson);

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

  async create(createProductDto: CreateProductDto) {

    const data = JSON.stringify(createProductDto);
    const obj = JSON.parse(data);

    const db = admin.firestore();
    let result;

    let catArr = obj.categories;
    let subCarArr = obj.sub_categories;
    let tagArr = obj.tags;
    let catList = [];
    let tagsList = [];

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

    await catArr.forEach((item) => {
      const catData = this.categories.find((p) => p.slug === item);
      let dItem = {
        id: catData.id,
        name: catData.name,
        slug: catData.slug,
        parent: catData.parent,
        type_id: 1
      }
      catList.push(dItem);
    });

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
    });

    await tagArr.forEach((item) => {
      const tagData = this.tags.find((p) => p.id === Number(item));
      let tItem = {
        id: tagData.id,
        name: tagData.name,
        slug: tagData.slug,
        icon: tagData.icon,
        type_id: 1
      }

      tagsList.push(tItem);

    });

    obj.categories = catList;
    obj.tags = tagsList;

    if(obj.variations.length < 1) {
      delete obj.variation_options;
    }
    delete obj.sub_categories;

    let resultObj = {...obj, slug: product_slug, type: product_type};

//    console.log("ALL: " + JSON.stringify(resultObj));

    try {
        const docRef = db.collection('products');
      //  const slug = createProductDto.name;
        await docRef.add(resultObj)
        .then(async(res) => {
          await docRef.doc(res.id).update({
            id: res.id
          })
        })
        .catch(console.error);

      } catch (e) {
        throw e;
      }

      return {
        success: true,
        message: 'Product created successful',
      };

  }

  async getProducts({ limit, page, search }: GetProductsDto): Promise<ProductPaginator> {
    const db = admin.firestore();
    const docRef = db.collection('products');
    let results;
    let url;
    let data = [];
    if (!page) page = 1;
    if (!limit) limit = 30;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    //let data: Product[] = this.products;
    const snapshot = await docRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          data.push(doc.data());

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

        });
    });
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

  getPopularProducts({ limit, type_slug }: GetPopularProductsDto): Product[] {
    let data: any = this.products;
    if (type_slug) {
      data = fuse.search(type_slug)?.map(({ item }) => item);
    }
    return data?.slice(0, limit);
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const db = admin.firestore();
    const docRef = db.collection('products');

    let results;
    let related_products;
    let data = [];
    let product;

    const snapshot = await docRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          data.push(doc.data());

        });
    });

    product = data.find((p) => p.slug === slug);
    //console.log("PRODUCT DATA:" + JSON.stringify(product));
    related_products = data
      .filter((p) => p.type.slug === product.type.slug)
      .slice(0, 20);

  /*  await db.collection('products').where("slug", "==", slug)
    .get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          product.push(doc.data());
        });
    })
    .catch((error) => {
      console.log("Error getting documents: ", error);
    }); */

//    console.log("GET PRODUCTS BY SLUG!");

    return {
      ...product,
      related_products,
    };
  }

  getSalesProducts({ limit, type_slug }: GetSalesProductsDto): Product[] {
  //  let data = [];
    let data: any = this.products.filter((p) => p.price > p.sale_price && p.sale_price !== null);
    if (type_slug) {
      data = fuse.search(type_slug)?.map(({ item }) => item);
    }
    return data?.slice(0, limit);
  }

  async getProductsByCategory(categories_slug: string): Promise<Product[]> {

    const db = admin.firestore();
    const docRef = db.collection('products');

    let data = [];
    let results;
    let mfuse;

    const moptions = {
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

    const snapshot = await docRef.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          data.push(doc.data());
        });
    });

    mfuse = new Fuse(data, moptions);
    results = mfuse.search(categories_slug)?.map(({ item }) => item);
  //  let data: any = this.products;

//  console.log("GET PRODUCTS BY CATEGORY!");

    //const products = this.products.filter((p) => p.categories.includes(category_slug));
    return results;
  }

 async update(id: string, updateProductDto: UpdateProductDto) {
  //  console.log("PRODUCTS UPDATE: ", JSON.stringify(updateProductDto));
    const data = JSON.stringify(updateProductDto);
    const obj = JSON.parse(data);

    //console.log("PRODUCTS UPDATE: ", obj);
    let result = false;

    let catArr = obj.categories;
    let subCarArr = obj.sub_categories;
    let tagArr = obj.tags;
    let catList = [];
    let tagsList = [];

    let product_slug = obj.name.toLowerCase().replaceAll(" ", "-");

    await catArr.forEach((item) => {
      const catData = this.categories.find((p) => p.slug === item);
      let dItem = {
        id: catData.id,
        name: catData.name,
        slug: catData.slug,
        parent: catData.parent,
        type_id: 1
      }
      catList.push(dItem);
    });

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
    });

    await tagArr.forEach((item) => {
      const tagData = this.tags.find((p) => p.id === Number(item));
      let tItem = {
        id: tagData.id,
        name: tagData.name,
        slug: tagData.slug,
        icon: tagData.icon,
        type_id: 1
      }

      tagsList.push(tItem);

    });

    obj.categories = catList;
    obj.tags = tagsList;

    if(obj.variations.length < 1) {
      delete obj.variation_options;
    }
    //delete obj.sub_categories;

    let resultObj = {...obj, slug: product_slug};

    const docRef = admin.firestore().collection('products').doc(id);
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
   const docRef = admin.firestore().collection('products').doc(id);
    await docRef.delete();
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
