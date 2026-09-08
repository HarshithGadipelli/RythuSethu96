async function testMultiCheckout() {
  try {
    const res = await fetch('http://localhost:5000/api/orders/checkout-multi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: '6a95d520f6f78967d9ffc17d',
        paymentMode: 'cod',
        items: [
          {
            cropId: '6a95d521f6f78967d9ffc2b1',
            quantity: 2,
            subtotal: 130,
            deliveryCharges: 35,
            totalAmount: 165,
            deliveryAddress: 'Flat 402, Green Meadows, Jubilee Hills, Hyderabad',
            deliveryDistance: 12
          },
          {
            cropId: '6a95d521f6f78967d9ffc2b3',
            quantity: 3,
            subtotal: 114,
            deliveryCharges: 40,
            totalAmount: 154,
            deliveryAddress: 'H.No 12-5/A, Botanical Garden Road, Gachibowli, Hyderabad',
            deliveryDistance: 15
          }
        ]
      })
    });
    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Success:', data.success);
    console.log('Orders created count:', data.orders?.length);
    if (data.orders) {
      data.orders.forEach((o, i) => {
        console.log('Order ' + (i+1) + ':');
        console.log('  ID: ' + o._id);
        console.log('  Crop: ' + o.productSnapshot?.name);
        console.log('  Delivery Address: ' + o.deliveryAddress);
        console.log('  Delivery Coordinates: ' + o.deliveryLatitude + ', ' + o.deliveryLongitude);
        console.log('  Status: ' + o.status);
        console.log('  Agent: ' + o.agent);
        console.log('  multiLocationGroupId: ' + o.multiLocationGroupId);
      });
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

testMultiCheckout();
