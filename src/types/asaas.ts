export interface Customer {
  object: string;
  id: string;
  dateCreated: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  mobilePhone: string | null;
  address: string | null;
  addressNumber: string | null;
  complement: string | null;
  province: string | null;
  postalCode: string | null;
  cpfCnpj: string;
  personType: 'FISICA' | 'JURIDICA';
  deleted: boolean;
  additionalEmails: string | null;
  externalReference: string | null;
  notificationDisabled: boolean;
  observations: string | null;
  municipalInscription: string | null;
  stateInscription: string | null;
  canDelete: boolean;
  cannotBeDeletedReason: string | null;
  canEdit: boolean;
  cannotEditReason: string | null;
  city: string | null;
  cityName: string | null;
  state: string | null;
  country: string;
}

export interface CustomerListResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: Customer[];
}

export interface CreateCustomerInput {
  name: string;
  cpfCnpj: string;
  mobilePhone: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  customer_id: string;
}

export interface Charge {
  object: string;
  id: string;
  dateCreated: string;
  customer: string;
  value: number;
  netValue: number;
  interestValue: number;
  discount: number;
  description: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  status: string;
  statusDate: string | null;
  dueDate: string;
  originalDueDate: string;
  paymentDate: string | null;
  installmentNumber: number;
  totalInstallments: number;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  invoiceNumber: string | null;
  externalReference: string | null;
  deleted: boolean;
  anticipated: boolean;
  anticipatedDate: string | null;
  creditCard: CreditCard | null;
  pixTransaction: PixTransaction | null;
  paymentLink: string | null;
  paymentLinkInfo: PaymentLinkInfo | null;
}

export interface CreditCard {
  creditCardBrand: string;
  creditCardNumber: string;
  creditCardToken: string;
  creditCardHolderName: string;
  creditCardHolderEmail: string;
  creditCardHolderCpfCnpj: string;
  creditCardHolderPhone: string;
  creditCardHolderPostalCode: string;
  creditCardHolderAddressNumber: string;
  creditCardHolderAddressComplement: string;
  creditCardHolderDistrict: string;
  creditCardHolderAddressStreet: string;
  creditCardHolderCity: string;
  creditCardHolderState: string;
  creditCardHolderCountry: string;
}

export interface PixTransaction {
  qrCodeBase64Image: string;
  qrCodeCopyPaste: string;
  encodedImage: string;
  expirationDate: string;
  pixKey: string;
  additionalInfo: string;
}

export interface PaymentLinkInfo {
  url: string;
  payQRCodeUrl: string;
}

export interface ChargeListResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: Charge[];
}

export interface CreateChargeInput {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  installmentCount?: number;
  installmentValue?: number;
  externalReference?: string;
  discount?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  totalValue?: number;
}

export interface Invoice {
  object: string;
  id: string;
  status: string;
  statusDescription: string;
  description: string;
  value: number;
  netValue: number;
  interestValue: number;
  discount: number;
  dateCreated: string;
  dueDate: string;
  paymentDate: string | null;
  customer: string;
  customerName: string;
  payment: string | null;
  invoiceNumber: string | null;
  externalReference: string | null;
  deleted: boolean;
  anticipated: boolean;
  anticipatedDate: string | null;
  installmentNumber: number;
  totalInstallments: number;
}

export interface InvoiceListResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: Invoice[];
}
