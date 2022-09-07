export type Subscription = {
  email: string;
  firstName: string;
  source: string;
};

export type Unsubscription = {
  email: string;
};

export type Message = {
  email: string;
  name: string;
  message: string;
  source: string;
};
