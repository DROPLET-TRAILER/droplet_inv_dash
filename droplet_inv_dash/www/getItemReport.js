frappe.ready(function() {
  mainFunction("Trailer_Code")
});

async function mainFunction(itemToManufacture) {

  // //get details about the particular item
  // const itemDetailsJson = await getFrappeJson("Item/" + itemToManufacture)
  // console.log(itemDetailsJson)

  // // get the default bom of the item, this must be set, otherwise we should look at starting here and passing the bom_code in
  // const default_bom = itemDetailsJson.default_bom
  // console.log(default_bom)

  // // get the details of the bom given the name in the item
  // const bomDetails =  await getFrappeJson("BOM/" + default_bom);
  // console.log(bomDetails);

  // // get the list of work orders with this bom_no
  // const workOrders =  await getFrappeJson(`Work Order?filters=[["Work Order","bom_no","=","${default_bom}"]]`);
  // console.log(workOrders);
  // for (const key in workOrders) {
  //   //console.log(workOrders[key])
  //   const workOrder =  await getFrappeJson(`Work Order/${workOrders[key].name}`);
  //   console.log(workOrder);
  // }

  // get the list of sales orders

  //let item_report_list = new Map();

  class Item_report {
    constructor(item_code) {
      this.item_code = item_code;
      this.item_name = null;
      this.total_req = 0;
      this.current_inv = 0;
      this.lead_time = 0;
      this.lead_time_qty = 0;
      this.order_qty = 0;
      this.order_date = null;
      this.incomming_qty = 0;
      this.po_list = new Array();

      this.req_parts = new Array();

      
    }

    fill_item_report = async function () {
      console.log("fill item values test");
      let item = await getFrappeJson(`Item/${this.item_code}`);
      this.item_name = item.item_name;
      this.lead_time = item.lead_time_days;
      //this.current_inv = 
      //this.
      console.log("fill_item_report");
      console.log(item);
    };

    count = function (amount) {
      this.total_req += parseInt(amount);
    };
  }

  class Item_report_list {
    constructor() {
      this.list = new Map();
    }
    pushCount = function (item_code, required_amount) {
      if (!this.list.has(item_code)) {
        this.list.set(item_code, new Item_report(item_code));
      }
      this.list.get(item_code).count(required_amount);
    };

    fill_all = async function () {
      console.log("filling report list");
      for(const entry of this.list) {
        let value = entry[1];
        console.log(value)
        await value.fill_item_report();
      }
      console.log("done filling report list");
    };

    getMap = () => {
      return this.list;
    };
  }


  let item_report_list = new Item_report_list();
  

  const sales_orders =  await getFrappeJson(`Sales Order?filters=[["Sales Order","status","=","To Deliver and Bill"]]`);// this will probs break, im not sure what the status of open sales order are in the droptlet trailer implememntation
  console.log(sales_orders);
  for (const key in sales_orders) {
    //console.log(sales_orders[key])
    const sales_order =  await getFrappeJson(`Sales Order/${sales_orders[key].name}`);
    console.log(sales_order);
    console.log(`customer_name: ${sales_order.customer_name} delivery_date: ${sales_order.delivery_date} delivery_status: ${sales_order.delivery_status}`)
    const items_order = sales_order.items
    console.log(items_order);
    for (const key in items_order) {
      const item_order = items_order[key];
      // amount, bom_no, item_code 
      console.log(`item_code: ${item_order.item_code} amount: ${item_order.amount} bom_no: ${item_order.bom_no} delivery_date: ${item_order.delivery_date}`)
        // get the details of the bom given the name in the item
        const bomDetails =  await getFrappeJson(`BOM/${item_order.bom_no}`);
        console.log(bomDetails);
        for (const key in bomDetails.items) {
          const item = bomDetails.items[key];
          console.log(item);
          console.log(`item: ${item.item_code} ${item.item_name} amount: ${item.amount}`)
          // push the required amount of items to the list, if the item doesnt exist it will be added
          item_report_list.pushCount(item.item_code, parseInt(item.amount * item_order.amount));
        }
    }
  }
  await item_report_list.fill_all();
  let item_map = item_report_list.getMap()
  console.log(item_map);
  for(const key in item_map) {
    console.log("test end")
    
    console.log(item_map[key]);
  }

}

async function getFrappeJson(apiPath) {
  return (await (await fetch("/api/resource/" + apiPath)).json()).data
}