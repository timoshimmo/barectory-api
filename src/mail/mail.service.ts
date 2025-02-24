import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { Order } from 'src/orders/entities/order.entity';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';
import { Customer } from 'src/users/entities/customer.entity';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService, private config: ConfigService) {}

  async sendVerifyEmail(user: Customer, redirectUrl: string) {

    //const url = `barectory.com/verified`;
    const db = admin.firestore();

    await this.mailerService.sendMail({
      to: user.email,
      from: `"Non Reply" <${this.config.get('CONNECT_MAIL_FROM')}>`, // override default from
      subject: 'Barectory Registration',
      template: './registration', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        uid: user.uid,
        url: redirectUrl
      },
    })
    .then(async(r) => {
       console.log(r, 'email is sent');
       const docRef = db.collection('customer');
       await docRef.doc(user.uid).set(user).catch(console.error);
     })
     .catch((e) => {
       console.log(e, 'error sending email');
     });

  }

  async sendResetEmail(email: string, redirectUrl: string) {

    //const url = `barectory.com/verified`;

    await this.mailerService.sendMail({
      to: email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Reset Password',
      template: './reset', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        url: redirectUrl
      },
    })
    .then((r) => {
       console.log(r, 'email is sent');
     })
     .catch((e) => {
       console.log(e, 'error sending email');
     });

  }

  async sendOrderSummary(order: Order) {
    const url = `barectory.com/orders/${order.tracking_number}`;
    //const url = `www.barectory.com/orders/32tAPCHgn9Pf`;

    await this.mailerService.sendMail({
      to: order.customer.email,
      from: `"Non Reply" <${this.config.get('SALES_MAIL_FROM')}>`,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Barectory Order',
      template: './order', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: order.customer.name,
        url,
        shipping_address: order.shipping_address.address.formatted_address,
        tracking_number: order.tracking_number,
        discount: order.discount,
        total: order.total,
        order_date: order.created_at,
        sub_total: order.amount,
        products: order.products
      },
    })
    .then((r) => {
       console.log(r, 'email is sent');
     })
     .catch((e) => {
       console.log(e, 'error sending email');
     });
   }
}
