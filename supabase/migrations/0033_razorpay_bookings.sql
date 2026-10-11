-- Seva bookings paid online through Razorpay Checkout. The order is
-- created for the booking's exact amount; a signed payment for it (from
-- Checkout or the webhook) marks the booking paid with no office review.
alter table bookings drop constraint if exists bookings_payment_method_check;
alter table bookings add constraint bookings_payment_method_check
  check (payment_method in ('upi', 'counter', 'razorpay'));

-- The razorpay_order_id / razorpay_payment_id columns date from 0001.
create unique index if not exists bookings_razorpay_order_idx on bookings(razorpay_order_id) where razorpay_order_id is not null;
