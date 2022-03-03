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
      this.incomming_qty = 0;
      this.lead_time = 0;
      this.lead_time_qty = 0;
      this.order_qty = 0;
      this.order_date = null;
      this.last_PO = null;

      this.req_parts = new Array();
    }

    fill_item_report = async function () {
      console.log("fill item values test");
      let item = await getFrappeJson(`Item/${this.item_code}`);
      this.item_name = item.item_name;
      this.lead_time = item.lead_time_days;
      //this.current_inv = 
      //this.incomming_qty
      console.log("fill_item_report");
      console.log(item);
    };

    count = function (amount, needByDate) {
      this.total_req += parseInt(amount);
      //let daysUntilNeeded;
    };

    toJSON = function() {
      let newJson = {}
      newJson.item = this.item_code + " " + this.item_name
      newJson.total_req = this.total_req;
      newJson.current_inv = this.current_inv
      newJson.incomming_qty = this.incomming_qty
      newJson.lead_time = this.lead_time
      newJson.lead_time_qty = this.lead_time_qty
      newJson.order_qty = this.order_qty
      newJson.order_date = this.order_date
      newJson.PO = this.last_PO
      newJson.parts_calendar = null;
      return newJson;
    }
  }

  class Item_report_list {
    constructor() {
      this.list = new Map();
    }
    pushCount = function (item_code, required_amount, required_by_date) {
      if (!this.list.has(item_code)) {
        this.list.set(item_code, new Item_report(item_code));
      }
      this.list.get(item_code).count(required_amount, required_by_date);
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

    getJSONArray = () => {
      console.log("filling json array");
      let newJSONArray = new Array()
      for(const entry of this.list) {
        let value = entry[1];
        console.log(value)
        newJSONArray.push(value.toJSON());
      }
      console.log("done filling report list");
      return newJSONArray
    }
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
          item_report_list.pushCount(item.item_code, parseInt(item.amount * item_order.amount), sales_order.delivery_date);
        }
    }
  }
  await item_report_list.fill_all();
  console.log(item_report_list.list);
  console.log(JSON.stringify(item_report_list.list));
  for(const item_report of item_report_list.list) {
    console.log("test end")
    
    console.log(item_report);
    console.log(item_report[1].toJSON());
  }
  console.log(item_report_list.getJSONArray());
  console.log(JSON.stringify(item_report_list.getJSONArray()));
}

async function getFrappeJson(apiPath) {
  return (await (await fetch("/api/resource/" + apiPath)).json()).data
}