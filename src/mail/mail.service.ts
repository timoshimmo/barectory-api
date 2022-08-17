import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { Order } from 'src/orders/entities/order.entity';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendOrderSummary(order: Order) {
    console.log("ORDER DETAILS: " + JSON.stringify(order.customer));
    const url = `barectory.com/orders/${order.tracking_number}`;

    //const url = `www.barectory.com/orders/32tAPCHgn9Pf`;

    await this.mailerService.sendMail({
      to: order.customer.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Barectory Order Summary',
      template: './order', // `.hbs` extension is appended automatically
      context: { // ✏️ filling curly brackets with content
        name: order.customer.name,
        url,
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
