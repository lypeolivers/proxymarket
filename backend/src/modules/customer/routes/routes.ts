import { FastifyInstance } from 'fastify';
import { verifyAccessToken } from '../../../common/middlewares/verify-access-token.middleware';
import { env } from '../../../env';
import handleCreateCustomer from '../controllers/create-customer.controller';
import handleCreateCustomerGift from '../controllers/create-customer-gift.controller';
import handleDeleteCustomer from '../controllers/delete-customer.controller';
import handleDeleteCustomerGift from '../controllers/delete-customer-gift.controller';
import handleGetCustomer from '../controllers/get-customer.controller';
import handleGetCustomerPurchaseInfo from '../controllers/get-customer-purchase-info.controller';
import handleListCustomerGifts from '../controllers/list-customer-gifts.controller';
import handleListCustomers from '../controllers/list-customers.controller';
import handleUpdateCustomer from '../controllers/update-customer.controller';
import {
  CreateCustomerGiftSchema,
  DeleteCustomerGiftSchema,
  ListCustomerGiftsSchema,
} from '../schemas/customer-gift.schema';
import { CreateCustomerSchema } from '../schemas/create-customer.schema';
import { DeleteCustomerSchema } from '../schemas/delete-customer.schema';
import { GetCustomerSchema } from '../schemas/get-customer.schema';
import { GetCustomerPurchaseInfoSchema } from '../schemas/get-customer-purchase-info.schema';
import { ListCustomersSchema } from '../schemas/list-customers.schema';
import { UpdateCustomerSchema } from '../schemas/update-customer.schema';

export default async function (app: FastifyInstance) {
  const http = app as any;
  const prefix = `${env.BASE_URL}/customer`;
  const onRequest = [verifyAccessToken];

  http.get(`${prefix}`, { schema: ListCustomersSchema, onRequest }, handleListCustomers);
  http.get(
    `${prefix}/:id/purchase-info`,
    { schema: GetCustomerPurchaseInfoSchema, onRequest },
    handleGetCustomerPurchaseInfo
  );
  http.get(
    `${prefix}/:id/gift`,
    { schema: ListCustomerGiftsSchema, onRequest },
    handleListCustomerGifts
  );
  http.post(
    `${prefix}/:id/gift`,
    { schema: CreateCustomerGiftSchema, onRequest },
    handleCreateCustomerGift
  );
  http.delete(
    `${prefix}/:id/gift/:giftId`,
    { schema: DeleteCustomerGiftSchema, onRequest },
    handleDeleteCustomerGift
  );
  http.get(`${prefix}/:id`, { schema: GetCustomerSchema, onRequest }, handleGetCustomer);
  http.post(`${prefix}`, { schema: CreateCustomerSchema, onRequest }, handleCreateCustomer);
  http.put(`${prefix}/:id`, { schema: UpdateCustomerSchema, onRequest }, handleUpdateCustomer);
  http.delete(`${prefix}/:id`, { schema: DeleteCustomerSchema, onRequest }, handleDeleteCustomer);
}
