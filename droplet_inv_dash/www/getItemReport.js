async function getItemReportFromDatabase() {

  class Cache_api {
    constructor() {
      this.cached_pages = new Map();
    }

    // general function for caching api request for short term storage
    request = async (apiPath, apiFunction) => {
      if(!this.cached_pages.has(apiPath)){
        console.log(`#### Page not in cache: ${apiPath}`)
        this.cached_pages.set(apiPath, await apiFunction(apiPath))
      } 
      console.log(`#### loading from cache: ${apiPath} ${this.cached_pages.get(apiPath)}`)
      return this.cached_pages.get(apiPath) 
    }


    getFrappeJson = async function(apiPath) {
      if(!this.cached_pages.has(apiPath)){
        console.log(`Page ${apiPath} not in cache`)
        await this.cached_pages.set(apiPath, getFrappeJson(apiPath))
      } 
      return this.cached_pages.get(apiPath) 
    }
  }

  class Item_report {
    constructor(item_code, date_from_server) {
      this.server_date = date_from_server;
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

    fill_item_report = async function (inventory) {
      //console.log("fill item values test");
      let item = await getFrappeJson(`resource/Item/${this.item_code}`);
      this.item_name = item.item_name;
      this.lead_time = item.lead_time_days;
      if(inventory.has(this.item_code)) {
        this.current_inv = inventory.get(this.item_code).actual_qty
        this.incomming_qty = inventory.get(this.item_code).projected_qty - this.current_inv;
      }

      //console.log("fill_item_report");
      //console.log(item);
    };

    count = function (amount, needByDate) {
      this.total_req += parseInt(amount);
      //console.log(needByDate)
      let daysUntilNeeded = getDaysBetweenDates(this.server_date, convertFrappeDateToDate(needByDate));
      //console.log(daysUntilNeeded)
      let tempAmount = this.req_parts[daysUntilNeeded]
      this.req_parts[daysUntilNeeded] = amount
      if(tempAmount > 0) {
        this.req_parts[daysUntilNeeded] += tempAmount
      }
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
    constructor(date_from_server) {
      this.server_time = date_from_server;
      this.list = new Map();
    }
    pushCount = function (item_code, required_amount, required_by_date) {
      if (!this.list.has(item_code)) {
        this.list.set(item_code, new Item_report(item_code, this.server_time));
      }
      this.list.get(item_code).count(required_amount, required_by_date);
    };

    fill_all = async function (inventory) {
      console.log("filling report list");
      for(const entry of this.list) {
        let value = entry[1];
        //console.log(value)
        await value.fill_item_report(inventory);
      }
      console.log("done filling report list");
    };

    getMap = () => {
      return this.list;
    };

    getJSONArray = () => {
      //console.log("filling json array");
      let newJSONArray = new Array()
      for(const entry of this.list) {
        let value = entry[1];
        //console.log(value)
        newJSONArray.push(value.toJSON());
      }
      //console.log("done filling json array");
      return newJSONArray
    }
  }

  
  let frappe_server_date = await getFrappeJson("method/droplet_inv_dash.droplet_inv_dash.doctype.servertime.server_date")
  console.log(frappe_server_date)
  // pass the item report the date it was created at, get this date from the server
  let item_report_list = new Item_report_list(convertFrappeDateToDate(frappe_server_date));
  let cache = new Cache_api()

  
  
  const inventoryJSON = await getFrappeJson("method/erpnext.stock.dashboard.item_dashboard.get_data");
  let inventory = new Map()
  for(const inventory_item of inventoryJSON) {
    //console.log(inventory_item)
    inventory.set(inventory_item.item_code, inventory_item)
  }
  console.log(`inventory from server`)
  console.log(inventory)
  // customer_name, delivery_date, items, filter by delivery_status 
  const sales_orders =  await getFrappeJson(`resource/Sales Order?filters=[["Sales Order","status","=","To Deliver and Bill"]]`);// this will probs break, im not sure what the status of open sales order are in the droptlet trailer implememntation
  //console.log(sales_orders);
  for (const key in sales_orders) {
    //console.log(sales_orders[key])
    //could avaoid doing this second request if proper field names are declared in the first reqest, by default only name is returned
    // customer_name, delivery_date, items, filter by delivery_status 
    const sales_order =  await getFrappeJson(`resource/Sales Order/${sales_orders[key].name}`);
    //console.log(sales_order);
    console.log(`customer_name: ${sales_order.customer_name} delivery_date: ${sales_order.delivery_date} delivery_status: ${sales_order.delivery_status}`)
    const items_order = sales_order.items
    //console.log(items_order);
    for (const key in items_order) {
      const item_order = items_order[key];
      // amount, bom_no, item_code 
      console.log(`item_code: ${item_order.item_code} amount: ${item_order.amount} bom_no: ${item_order.bom_no} delivery_date: ${item_order.delivery_date}`)
        // get the details of the bom given the name in the item
        const bomDetails = await cache.request(`resource/BOM/${item_order.bom_no}`, getFrappeJson);
        //console.log(bomDetails);
        for (const key in bomDetails.items) {
          const item = bomDetails.items[key];
          //console.log(item);
          console.log(`item: ${item.item_code} ${item.item_name} amount: ${item.amount}`)
          // push the required amount of items to the list, if the item doesnt exist it will be added
          item_report_list.pushCount(item.item_code, parseInt(item.amount * item_order.amount), sales_order.delivery_date);
        }
    }
  }
  await item_report_list.fill_all(inventory);
  console.log(item_report_list.list);
  //console.log(JSON.stringify(item_report_list.list));
  for(const item_report of item_report_list.list) {
    //console.log("test end")
    
    //console.log(item_report);
    //console.log(item_report[1].toJSON());
  }
  //console.log(item_report_list.getJSONArray());

  //jsonArray = item_report_list.getJSONArray();
  //fillTable();
  
  return item_report_list.getJSONArray()
}

function convertFrappeDateToDate(date_from_server) {
  let dateArray = date_from_server.split("-");
  //console.log(`Date from server ${dateArray}`);
  let date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
  return date;
}

async function getFrappeJson(apiPath) {
  let json = await (await fetch("/api/" + apiPath)).json()
  if(json.hasOwnProperty('message')){
    return json.message
  } else {
    return json.data
  }
  
}

function getDaysBetweenDates(date_past, date_future) {
 // console.log(date_past)
  //console.log(date_future)
  const diffTime = Math.abs(date_future - date_past);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// frappe.ready(async function() {
//   let report = await getItemReportFromDatabase();
//   jsonArray = item_report_list.getJSONArray();
//   //clearTable();
//   fillTable();
//   console.log("##### OBJECT #####");
//   console.log(report);
//   console.log("##### String #####");
//   console.log(JSON.stringify(report));
  
// });

async function fillTableDriver() {
  let report = await getItemReportFromDatabase();
  jsonArray = report;
  //clearTable();
  fillTable();
  console.log("##### OBJECT #####");
  console.log(report);
  console.log("##### String #####");
  console.log(JSON.stringify(report));
  
}