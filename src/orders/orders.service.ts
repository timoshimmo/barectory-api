import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersDto, OrderPaginator } from './dto/get-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import ordersJson from '@db/orders.json';
import orderStatusJson from '@db/order-statuses.json';
import orderFilesJson from './order-files.json';
import { plainToClass } from 'class-transformer';
import { Order, OrderFiles, PaymentGatewayType } from './entities/order.entity';
import { OrderUser } from 'src/users/entities/user.entity';
import { OrderProduct, OrderProductPivot } from 'src/products/entities/product.entity';
import { OrderStatus } from './entities/order-status.entity';
import { paginate } from 'src/common/pagination/paginate';
import { MailService } from 'src/mail/mail.service';
import {
  GetOrderStatusesDto,
  OrderStatusPaginator,
} from './dto/get-order-statuses.dto';
import {
  CheckoutVerificationDto,
  VerifiedCheckoutData,
} from './dto/verify-checkout.dto';
import {
  CreateOrderStatusDto,
  UpdateOrderStatusDto,
} from './dto/create-order-status.dto';
import { GetOrderFilesDto } from './dto/get-downloads.dto';
import Fuse from 'fuse.js';
import * as admin from 'firebase-admin';

const orders = plainToClass(Order, ordersJson);
const orderStatus = plainToClass(OrderStatus, orderStatusJson);

const orderFiles = plainToClass(OrderFiles, orderFilesJson);

@Injectable()
export class OrdersService {
  private orders: Order[] = orders;
  private orderStatus: OrderStatus[] = orderStatus;
  private orderFiles: OrderFiles[] = orderFiles;
//  private mailService: MailService;

constructor(private mailService: MailService) {}

async create(createOrderInput: CreateOrderDto) {
    //console.log("ORDER: " + JSON.stringify(createOrderInput));
    const data = JSON.stringify(createOrderInput);
    const obj = JSON.parse(data);

    let productsArr = obj.products;
    let orderProducts: OrderProduct[] = [];

    //const db = admin.firestore();

    const db = admin.firestore();

    let trackingNumber = this.randomString(12, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  //  const statusData = this.orderStatus.find((p) => p.id === obj.status);

  await productsArr.forEach((item, index) => {

    let variationId = null;

    if(item.variation_option_id) {
      variationId = item.variation_option_id;
    }

    const productPivot: OrderProductPivot = {
      variation_option_id: variationId,
      order_quantity: item.order_quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }

    const productsData: OrderProduct = {
      product_id: item.product_id,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      image: item.image,
      name: item.name,
      slug: item.slug,
      pivot:productPivot,
    }

    orderProducts.push(productsData);

  })

  //  delete obj.status;

    //obj.status = statusData;

    const orderStatus: OrderStatus = {
      id: 1,
      name: "Order Received",
      color: "#23b848",
      serial: 1,
      created_at: new Date(),
      updated_at: new Date(),
    }


    const newOrder: Order = {
      id: "1",
      customer_id: createOrderInput.customer.id,
      customer_contact: createOrderInput.customer_contact,
      customer: createOrderInput.customer,
      parent_order: null,
      children: null,
      status: orderStatus,
      amount: createOrderInput.amount,
      sales_tax: createOrderInput.sales_tax,
      total: createOrderInput.total,
      paid_total: createOrderInput.paid_total,
      payment_id: null,
      payment_gateway: PaymentGatewayType.PAYSTACK,
      coupon: null,
      discount: createOrderInput.discount,
      delivery_fee: createOrderInput.delivery_fee,
      delivery_time: "Express Delivery",
      products: orderProducts,
      shipping_address: createOrderInput.shipping_address,
      tracking_number: trackingNumber,
      created_at: new Date(),
      updated_at: new Date(),
    };

  //  let resultObj = {...obj, status: statusData, tracking_number: trackingNumber};

  //  console.log("RESULTS: " + JSON.stringify(resultObj));

    try {
        const docRef = db.collection('orders');
      //  const slug = createProductDto.name;
        await docRef.add(newOrder)
        .then(async(res) => {
          await docRef.doc(res.id).update({
            id: res.id
          })
            //console.log("Order created!")
        })
        .catch(console.error);

      } catch (e) {
        throw e;
      }

      try {
        await this.mailService.sendOrderSummary(newOrder);
      //  console.log(mailing);
      }
      catch (e) {
        throw e;
      }


      return newOrder;
  }

randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

async getOrders({
    limit,
    page,
    customer_id,
    tracking_number,
    search,
    shop_id,
  }: GetOrdersDto): Promise<OrderPaginator> {

    const db = admin.firestore();
    const docRef = db.collection('orders');

    if (!page) page = 1;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
  //  let data: Order[] = this.orders;
    let data = [];

    const snapshot = await docRef.get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              data.push(doc.data());
            });
    });

  /*  if (shop_id && shop_id !== 'undefined') {
      data = this.orders?.filter((p) => p?.shop?.id === Number(shop_id));
    }*/
    const results = data.slice(startIndex, endIndex);
    const url = `/orders?search=${search}&limit=${limit}`;
    return {
      data: results,
      ...paginate(data.length, page, limit, results.length, url),
    };
  }

  async getOrderById(id: string): Promise<Order> {

    let data = [];

    const db = admin.firestore();
    const docRef = db.collection('orders');

    const snapshot = await docRef.get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              data.push(doc.data());
            });
    });

    return data.find((p) => p.id === id);
  }

  async getOrderByTrackingNumber(tracking_number: string): Promise<Order> {

  //  console.log("TRACKING NUMBER SERVICE:" + tracking_number);
      let data = [];

      const db = admin.firestore();
      const docRef = db.collection('orders');

      const snapshot = await docRef.get().then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                data.push(doc.data());
              });
      });

    const parentOrder = data.find(
      (p) => p.tracking_number === tracking_number,
    );
    if (!parentOrder) {
      return this.orders[0];
    }
    return parentOrder;
  }

  getOrderStatuses({
    limit,
    page,
    search,
    orderBy,
  }: GetOrderStatusesDto): OrderStatusPaginator {
    if (!page || page.toString() === 'undefined') page = 1;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const data: OrderStatus[] = this.orderStatus;

    // if (shop_id) {
    //   data = this.orders?.filter((p) => p?.shop?.id === shop_id);
    // }
    const results = data.slice(startIndex, endIndex);
    const url = `/order-status?search=${search}&limit=${limit}`;

    return {
      data: results,
      ...paginate(data.length, page, limit, results.length, url),
    };
  }

  getOrderStatus(slug: string) {
    return this.orderStatus.find((p) => p.name === slug);
  }

  update(id: number, updateOrderInput: UpdateOrderDto) {
    console.log("UPDATE ORDER: " + updateOrderInput);
    return this.orders[0];
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }

  verifyCheckout(input: CheckoutVerificationDto): VerifiedCheckoutData {
    return {
      total_tax: 0,
      shipping_charge: 0,
      unavailable_products: [],
      wallet_currency: 0,
      wallet_amount: 0,
    };
  }

  createOrderStatus(createOrderStatusInput: CreateOrderStatusDto) {
    return this.orderStatus[0];
  }

  updateOrderStatus(updateOrderStatusInput: UpdateOrderStatusDto) {
    return this.orderStatus[0];
  }

  async getOrderFileItems({ page, limit }: GetOrderFilesDto) {
    if (!page) page = 1;
    if (!limit) limit = 30;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = orderFiles.slice(startIndex, endIndex);

    const url = `/downloads?&limit=${limit}`;
    return {
      data: results,
      ...paginate(orderFiles.length, page, limit, results.length, url),
    };
  }

  async getDigitalFileDownloadUrl(digitalFileId: number) {
    const item: OrderFiles = this.orderFiles.find(
      (singleItem) => singleItem.digital_file_id === digitalFileId,
    );

    return item.file.url;
  }
}
