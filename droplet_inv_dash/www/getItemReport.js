
class Cache_api {
  constructor() {
    this.cached_pages = new Map();
  }

  // general function for caching api request for short term storage
  request = async (apiPath, apiFunction) => {
    if (!this.cached_pages.has(apiPath)) {
      this.cached_pages.set(apiPath, await apiFunction(apiPath))
    }
    return this.cached_pages.get(apiPath)
  }
}

let cache = new Cache_api();

class Item_report {
  constructor(item_code, date_from_server) {
    this.flag = null;
    this.server_date = date_from_server;
    this.item_code = item_code;
    this.item_name = null;
    this.total_req = 0;
    this.current_inv = 0;
    this.current_stock = new Array(12);
    this.incomming_qty = 0;
    this.lead_time = 0;
    this.lead_time_qty = 0;
    this.order_qty = 0;
    this.order_date = null;
    this.last_PO = null;
    this.is_included_in_manu = true;
    this.back_order = new Array(12);
    this.req_parts = new Array();
    this.parts_calendar = null;
  }

  fill_item_report = async function () {
    //get item name and lead time from item doctype
    let item = await cache.request(`resource/Item/${this.item_code}`, getFrappeJson);
    if (item.is_stock_item == 0) {
      // do not do the calculation for this item, remove it in the next step.
      this.is_included_in_manu = false;
      return;
    }

    this.item_name = item.item_name;
    this.lead_time = item.lead_time_days;


    let inventory_info_accumulated = {
      actual_qty: 0,
      projected_qty: 0,
      reserved_qty: 0,
      reserved_qty_for_production: 0,
      reserved_qty_for_sub_contract: 0
    };

    let hasInventory = false;
    hasInventory = await this.fill_inventory(inventory_info_accumulated);

    if (hasInventory) {
      this.current_inv = inventory_info_accumulated.actual_qty;
      this.incomming_qty = (inventory_info_accumulated.projected_qty + inventory_info_accumulated.reserved_qty + inventory_info_accumulated.reserved_qty_for_production) - this.current_inv;
    } else {
      // if item is not stored in database, it will be assumed there is 0 for calculations
      this.current_inv = "N/A"
      this.incomming_qty = "N/A"
    }
    


    //get last PO for order, limit to 1 and only get PO's that have not been received
    let last_po = await getFrappeJson(`resource/Purchase Order?filters=[["Purchase Order Item","item_code","=","${this.item_code}"], ["Purchase Order","docstatus","=","1"], ["Purchase Order","per_received","!=",100], ["Purchase Order","status","not in",["Draft","On Hold","Cancelled","Closed","Completed"]]]&limit=1`)
    if (last_po.length > 0) {
      this.last_PO = last_po[0].name;
    } else {
      this.last_PO = "N/A";
      // if there are no PO then there is no incomming orders
      this.incomming_qty = 0
    }

    let remaining_parts_on_day = 0
    
    // calculate the number of days that you have inventory for
    
    let count_parts_inv = 0;
    let days_of_inv = 0;
    // crawl through days until you find the days covered by inventory
    for (let i = 0; i < this.req_parts.length; i++) {
      if (this.req_parts[i]) {
        count_parts_inv += this.req_parts[i];
        days_of_inv = i;
        if (this.current_inv == "N/A") {
          remaining_parts_on_day = count_parts_inv;
          break;
        }
        if (count_parts_inv >= (this.current_inv + this.incomming_qty)) {
          remaining_parts_on_day = count_parts_inv - (this.current_inv + this.incomming_qty);
          break;
        }
      }
    }

    //calculate number of items that are not in inventory
    if (this.total_req > (this.current_inv + this.incomming_qty)) {
      
      let order_date = new Date();
      let daysUntilOrder = days_of_inv - this.lead_time;
      if (daysUntilOrder < 0) {
        daysUntilOrder = 0;
      }
      order_date.setDate(this.server_date.getDate() + daysUntilOrder);
      this.order_date = order_date;
      this.order_date_formatted = order_date.toISOString().slice(0, 10);

      // add 1 to every lead time to ignore the present day
      let lead_time_index = days_of_inv + this.lead_time + 1;
      if (lead_time_index > this.req_parts.length) {
        lead_time_index = this.req_parts.length;
      }
      this.lead_time_qty += remaining_parts_on_day;
      for (let i = days_of_inv + 1; i < lead_time_index; i++) {
        if (this.req_parts[i] > 0) {
          this.lead_time_qty += this.req_parts[i];
        }
      }

      if (this.current_inv == "N/A") {
        this.order_qty = this.total_req - this.lead_time_qty

      } else {
        this.order_qty = this.total_req - this.incomming_qty - this.current_inv - this.lead_time_qty

      }
      

      

    } else {
      this.lead_time_qty = 0;
      this.order_qty = 0;
      this.order_date_formatted = "N/A";
    }

    // set flag based off of distance to order date from current date
    if (this.order_date_formatted == "N/A") {
      this.flag = "white";
    } else {
      let daysUntilOrder = getDaysBetweenDates(this.server_date, this.order_date);
      console.log(`days between ${this.server_date} and ${this.order_date} is ${daysUntilOrder}`);
      if (daysUntilOrder <= 1) {
        this.flag = "red";
      } else if (daysUntilOrder < 7) {
        this.flag = "orange";
      } else if (daysUntilOrder < 14) {
        this.flag = "yellow";
      } else if (daysUntilOrder < 21) {
        this.flag = "lightgreen";
      } else if (daysUntilOrder < 35) {
        this.flag = "green";
      } else {
        this.flag = "green";
      }
    }
    
    // starting to try to make the calendar
    let parts_per_month = [0,0,0,0,0,0,0,0,0,0,0,0];
    console.log(this.req_parts)

    // requirements
    for (let i = 0; i < this.req_parts.length; i++) {
      let tempDay = new Date(this.server_date);
      tempDay.setDate(this.server_date.getDate() + i);
      let current_month = tempDay.getMonth();
      
      if(this.req_parts[i] > 0) {
        if(parts_per_month[current_month] ==  0) {
          parts_per_month[current_month] = this.req_parts[i]
        } else { 
          parts_per_month[current_month] += this.req_parts[i]
        }
      }
    }
    this.parts_calendar = []
    let month = this.server_date.getMonth();
    let tempDay = new Date(this.server_date);
    tempDay.setDate(this.server_date.getDate() + days_of_inv);
    let inv_until_month = tempDay.getMonth();
    tempDay.setDate(this.server_date.getDate() + this.lead_time);
    let lead_time_months = tempDay.getMonth();
    let inv_months_finished = false;
    let lead_months_finished = false;

    // Colour for each Month
    for (let i = 0; i < parts_per_month.length; i++) {
      let month_no = (i + month) % 12;
      //console.log(month_no);
      if(!inv_months_finished) {
        this.parts_calendar[month_no] = [month_no, parts_per_month[month_no], "green"];
      } else if (!lead_months_finished) {
        this.parts_calendar[month_no] = [month_no, parts_per_month[month_no], "blue"];
      } else if (parts_per_month[month_no] > 0){
        this.parts_calendar[month_no] = [month_no, parts_per_month[month_no], "red"];
      } else {
        this.parts_calendar[month_no] = [month_no, parts_per_month[month_no], "white"];
      }

      if(month_no == inv_until_month) {
        inv_months_finished = true;
      }
      if(month_no == lead_time_months) {
        lead_months_finished = true;
      }
    }
  
    let temp_curr = this.current_inv;
  
    for (let i = 0; i < this.current_stock.length; i++) {
      let month_no = (i + month) % 12;
      this.current_stock[month_no] = [month_no, temp_curr];
      temp_curr -= parts_per_month[month_no];
      this.back_order[month_no] = [month_no, temp_curr];
    }

    console.log(this.current_stock)

    // console.log(this.parts_calendar)
  };

  count = function (amount, needByDate) {
    this.total_req += parseInt(amount);
    let daysUntilNeeded = parseInt(getDaysBetweenDates(this.server_date, needByDate));
    let tempAmount = this.req_parts[daysUntilNeeded]
    this.req_parts[daysUntilNeeded] = parseInt(amount)
    if (tempAmount > 0) {
      this.req_parts[daysUntilNeeded] += tempAmount
    }
  };

  toJSON = function () {
    let newJson = {}
    newJson.flag = this.flag;
    newJson.item = this.item_code + " " + this.item_name
    newJson.item_code = this.item_code;
    newJson.total_req = this.total_req;
    newJson.current_inv = this.current_inv
    newJson.incomming_qty = this.incomming_qty
    newJson.lead_time = this.lead_time
    newJson.lead_time_qty = this.lead_time_qty
    newJson.order_qty = this.order_qty
    newJson.order_date = this.order_date_formatted
    newJson.PO = this.last_PO
    newJson.parts_calendar = this.parts_calendar
    newJson.current_stock = this.current_stock
    newJson.back_order = this.back_order
    return newJson;
  }

  async fill_inventory(inventory_info_accumulated) {
    const inventory_info = await getFrappeJson(`method/erpnext.stock.dashboard.item_dashboard.get_data?item_code=${this.item_code}`);
    let hasInventory = false;
    for (const inventory_item of inventory_info) {
      //console.log(inventory_item)
      inventory_info_accumulated.actual_qty += parseInt(inventory_item.actual_qty);
      inventory_info_accumulated.projected_qty += parseInt(inventory_item.projected_qty);
      inventory_info_accumulated.reserved_qty += parseInt(inventory_item.reserved_qty);
      inventory_info_accumulated.reserved_qty_for_production += parseInt(inventory_item.reserved_qty_for_production);
      inventory_info_accumulated.reserved_qty_for_sub_contract += parseInt(inventory_item.reserved_qty_for_sub_contract);
      hasInventory = true;
    } 
    return hasInventory;
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

  fill_all = async function () {
    let num_items = this.list.size;
    setProgressBarCount(num_items)
    for (const entry of this.list) {
      let value = entry[1];
      await value.fill_item_report();
      setProgressBarCount(num_items)
    }
  };

  remove_items_not_included = function() {
    for (const entry of this.list) {
      let value = entry[1];
      if(!value.is_included_in_manu) {
        this.list.delete(entry[0]);
      }
    }
  }

  getMap = () => {
    return this.list;
  };

  getJSONArray = () => {
    let newJSONArray = new Array()
    for (const entry of this.list) {
      let value = entry[1];
      newJSONArray.push(value.toJSON());
    }
    return newJSONArray
  }
}

// *********************** FASTEST ONE ***********************

async function getItemReportFromDatabase() {
    console.time("getItemReportFromDatabase");
  
    // Helper function to fetch BOM items recursively
    async function fetchBOMItems(itemCode, itemQty, needByDate, cache) {
      const itemData = await cache.request(`resource/Item/${itemCode}`, getFrappeJson);
      if (!itemData.hasOwnProperty("default_bom")) {
        item_report_list.pushCount(itemCode, itemQty, needByDate);
      } else {
        const bomDetails = await cache.request(`resource/BOM/${itemData.default_bom}`, getFrappeJson);
        const bomItemsPromises = bomDetails.items.map(async (subItem) => {
          await fetchBOMItems(
            subItem.item_code,
            itemQty * parseInt(subItem.qty),
            needByDate,
            cache
          );
        });
        await Promise.all(bomItemsPromises);
      }
    }
  
    let frappe_server_date = await getFrappeJson(
      "method/droplet_inv_dash.droplet_inv_dash.doctype.servertime.server_date"
    );
    if (frappe_server_date == null) {
      console.log("not signed in");
      return;
    }
    let server_date = convertFrappeDateToDate(frappe_server_date);
  
    let item_report_list = new Item_report_list(server_date);
  
    let progressBarSize = 0;
  
    const sales_orders = await getFrappeJson(
      `resource/Sales Order?filters=[["Sales Order","delivery_status","=","Not Delivered"], ["Sales Order","status","!=","Closed"], ["Sales Order","docstatus","!=", "2"]]`
    );
    for (const key in sales_orders) {
      const sales_order = await getFrappeJson(`resource/Sales Order/${sales_orders[key].name}`);
      progressBarSize += sales_orders.length * sales_order.items.length;
  
      const salesOrderItemsPromises = sales_order.items.map(async (sales_order_item) => {
        setProgressBarCount(progressBarSize);
  
        let item_lead_time = document.getElementById("item_lead_time").value;
        let delivery_date = convertFrappeDateToDate(sales_order_item.delivery_date);
        let need_by_date = new Date(delivery_date);
        let todays_date = server_date;
        need_by_date.setDate(need_by_date.getDate() - item_lead_time);
        if (todays_date > need_by_date) {
          need_by_date = todays_date;
        }
  
        await fetchBOMItems(sales_order_item.item_code, parseInt(sales_order_item.qty), need_by_date, cache);
      });
  
      await Promise.all(salesOrderItemsPromises);
    }
  
    itemsLoaded = 0;
    await item_report_list.fill_all();
  
    item_report_list.remove_items_not_included();
  
    console.timeEnd("getItemReportFromDatabase");
  
    return item_report_list.getJSONArray();
  }

// *********************** fetch one item for testing purpose ***********************
// async function getItemReportFromDatabase() {
//   console.time("getItemReportFromDatabase");

//   // Helper function to fetch BOM items recursively
//   async function fetchBOMItems(itemCode, itemQty, needByDate, cache) {
//     const itemData = await cache.request(`resource/Item/${itemCode}`, getFrappeJson);
//     if (!itemData.hasOwnProperty("default_bom")) {
//       item_report_list.pushCount(itemCode, itemQty, needByDate);
//     } else {
//       const bomDetails = await cache.request(`resource/BOM/${itemData.default_bom}`, getFrappeJson);
//       const bomItemsPromises = bomDetails.items.map(async (subItem) => {
//         await fetchBOMItems(
//           subItem.item_code,
//           itemQty * parseInt(subItem.qty),
//           needByDate,
//           cache
//         );
//       });
//       await Promise.all(bomItemsPromises);
//     }
//   }

//   let frappe_server_date = await getFrappeJson(
//     "method/droplet_inv_dash.droplet_inv_dash.doctype.servertime.server_date"
//   );
//   if (frappe_server_date == null) {
//     console.log("not signed in");
//     return;
//   }
//   let server_date = convertFrappeDateToDate(frappe_server_date);

//   let item_report_list = new Item_report_list(server_date);

//   let progressBarSize = 0;

//   const sales_orders = await getFrappeJson(
//     `resource/Sales Order?filters=[["Sales Order","delivery_status","=","Not Delivered"], ["Sales Order","status","!=","Closed"], ["Sales Order","docstatus","!=", "2"]]`
//   );
//   for (const key in sales_orders) {
//     const sales_order = await getFrappeJson(`resource/Sales Order/${sales_orders[key].name}`);
//     progressBarSize += sales_orders.length * sales_order.items.length;

//     const salesOrderItemsPromises = sales_order.items.map(async (sales_order_item) => {
//       setProgressBarCount(progressBarSize);

//       let item_lead_time = document.getElementById("item_lead_time").value;
//       let delivery_date = convertFrappeDateToDate(sales_order_item.delivery_date);
//       let need_by_date = new Date(delivery_date);
//       let todays_date = server_date;
//       need_by_date.setDate(need_by_date.getDate() - item_lead_time);
//       if (todays_date > need_by_date) {
//         need_by_date = todays_date;
//       }

//       await fetchBOMItems(sales_order_item.item_code, parseInt(sales_order_item.qty), need_by_date, cache);

//       // Break after processing the first item
//       return false;
//     });

//     await Promise.all(salesOrderItemsPromises);
//     break; // Break after processing the first sales order
//   }

//   itemsLoaded = 0;
//   await item_report_list.fill_all();

//   item_report_list.remove_items_not_included();

//   console.timeEnd("getItemReportFromDatabase");

//   return item_report_list.getJSONArray();
// }

  
// ***** OLD CODE ? *****

// async function fetchBOMItems(itemCode, quantity, needByDate, cache, item_report_list) {
//     const fetchAndProcess = async (itemCode, quantity, needByDate) => {
//       const itemData = await cache.request(`resource/Item/${itemCode}`, getFrappeJson);
//       if (!itemData.hasOwnProperty("default_bom")) {
//         item_report_list.pushCount(itemCode, quantity, needByDate);
//       } else {
//         const bomDetails = await cache.request(`resource/BOM/${itemData.default_bom}`, getFrappeJson);
//         for (const bomItem of bomDetails.items) {
//           await fetchBOMItems(bomItem.item_code, quantity * parseInt(bomItem.qty), needByDate, cache, item_report_list);
//         }
//       }
//     };
  
//     return fetchAndProcess(itemCode, quantity, needByDate);
//   }
  
//   async function processInBatches(items, batchSize, callback) {
//     for (let i = 0; i < items.length; i += batchSize) {
//       const batch = items.slice(i, i + batchSize);
//       await Promise.all(batch.map((item) => callback(item)));
//     }
//   }
  
//   async function getItemReportFromDatabase() {
//     console.time("getItemReportFromDatabase");
  
//     // get the date from the server so that it is timezone independent for the client
//     let frappe_server_date = await getFrappeJson("method/droplet_inv_dash.droplet_inv_dash.doctype.servertime.server_date")
//     if (frappe_server_date == null) {
//       console.log("not signed in")
//       return;
//     }
//     let server_date = convertFrappeDateToDate(frappe_server_date);
  
//     // pass the item report the date it was created at, get this date from the server
//     let item_report_list = new Item_report_list(server_date);
  
//     const sales_orders = await getFrappeJson(
//       `resource/Sales Order?filters=[["Sales Order","delivery_status","=","Not Delivered"], ["Sales Order","status","!=","Closed"], ["Sales Order","docstatus","!=", "2"]]`
//     );
  
//     let progressBarSize = 0;
  
//     await processInBatches(sales_orders, 5, async (sales_order_data) => {
//       const sales_order = await getFrappeJson(`resource/Sales Order/${sales_order_data.name}`);
//       progressBarSize += sales_orders.length * sales_order.items.length;
  
//       let item_lead_time = document.getElementById("item_lead_time").value;
//       let delivery_date = convertFrappeDateToDate(sales_order.delivery_date);
//       let need_by_date = new Date(delivery_date);
//       let todays_date = server_date;
//       need_by_date.setDate(need_by_date.getDate() - item_lead_time);
//       if (todays_date > need_by_date) {
//         need_by_date = todays_date;
//       }
  
//       await processInBatches(sales_order.items, 5, async (sales_order_item) => {
//         setProgressBarCount(progressBarSize);
//         await fetchBOMItems(sales_order_item.item_code, parseInt(sales_order_item.qty), need_by_date, cache, item_report_list);
//       });
//     });
  
//     itemsLoaded = 0;
//     await item_report_list.fill_all();
  
//     item_report_list.remove_items_not_included();
  
//     console.timeEnd("getItemReportFromDatabase");
  
//     return item_report_list.getJSONArray();
//   }
  
  
  
  
  
// *********************** OG CODE ***********************

//   async function getItemReportFromDatabase() {
//     console.time('getItemReportFromDatabase');

  

//     // get the date from the server so that it is timezone independent for the client
//     let frappe_server_date = await getFrappeJson("method/droplet_inv_dash.droplet_inv_dash.doctype.servertime.server_date")
//     if (frappe_server_date == null) {
//       console.log("not signed in")
//       return;
//     }
//     let server_date = convertFrappeDateToDate(frappe_server_date);
  
//     // pass the item report the date it was created at, get this date from the server
//     let item_report_list = new Item_report_list(server_date);
  
//     // instantiate a cache, this is a global now
//     //let cache = new Cache_api()
  
//     let progressBarSize = 0;
//     // customer_name, delivery_date, items, filter by delivery_status
//     // this has to be done as multiple requests as "items" list is not a valid field while accessing bulk document data. see api/resource/Sales%20Order?fields=["*"]
//     const sales_orders = await getFrappeJson(`resource/Sales Order?filters=[["Sales Order","delivery_status","=","Not Delivered"], ["Sales Order","status","!=","Closed"], ["Sales Order","docstatus","!=", "2"]]`);
//     for (const key in sales_orders) {
      
//      // delivery_date, items list from the above list of orders
//       const sales_order = await getFrappeJson(`resource/Sales Order/${sales_orders[key].name}`);
//       progressBarSize += sales_orders.length * sales_order.items.length
//       const sales_order_item_list = sales_order.items
//       for (const key in sales_order_item_list) {
//         setProgressBarCount(progressBarSize)
//         const sales_order_item = sales_order_item_list[key];
//         // amount, bom_no, item_code
//         // TODO: use the items lead time to calculate when the parts actually have to arrive, for now subtract 14 days from delivery date
//         let item_lead_time = document.getElementById("item_lead_time").value;
//         let delivery_date = convertFrappeDateToDate(sales_order_item.delivery_date);
//         let need_by_date = new Date(delivery_date);
//         let todays_date = server_date;
//         need_by_date.setDate(need_by_date.getDate() - item_lead_time);
//         if (todays_date > need_by_date) {
//           need_by_date = todays_date;
//         }
//         let item_data = await cache.request(`resource/Item/${sales_order_item.item_code}`, getFrappeJson);
//         if(!item_data.hasOwnProperty('default_bom')){
//           item_report_list.pushCount(sales_order_item.item_code, parseInt(sales_order_item.qty), need_by_date);
//         } else {
//           const bomDetails1 = await cache.request(`resource/BOM/${item_data.default_bom}`, getFrappeJson);
//           for (const key in bomDetails1.items) {
//             const sub_item_1 = bomDetails1.items[key];
//             let sub_item_1_data = await cache.request(`resource/Item/${sub_item_1.item_code}`, getFrappeJson);
//             if(!sub_item_1_data.hasOwnProperty('default_bom')){
//               item_report_list.pushCount(sub_item_1.item_code, parseInt(sales_order_item.qty) * parseInt(sub_item_1.qty), need_by_date);
//             } else {
//               const bomDetails2 = await cache.request(`resource/BOM/${sub_item_1_data.default_bom}`, getFrappeJson);
//               for (const key in bomDetails2.items) {
//                 const sub_item_2 = bomDetails2.items[key];
//                 let sub_item_2_data = await cache.request(`resource/Item/${sub_item_2.item_code}`, getFrappeJson);
//                 if(!sub_item_2_data.hasOwnProperty('default_bom')){
//                   item_report_list.pushCount(sub_item_2.item_code, parseInt(sales_order_item.qty) * parseInt(sub_item_1.qty) * parseInt(sub_item_2.qty), need_by_date);
//                 } else {
//                   const bomDetails3 = await cache.request(`resource/BOM/${sub_item_2_data.default_bom}`, getFrappeJson);
//                   for (const key in bomDetails3.items) {
//                     const sub_item_3 = bomDetails3.items[key];
//                     let sub_item_3_data = await cache.request(`resource/Item/${sub_item_3.item_code}`, getFrappeJson);
//                     if(!sub_item_3_data.hasOwnProperty('default_bom')){
//                       item_report_list.pushCount(sub_item_3.item_code, parseInt(sales_order_item.qty) * parseInt(sub_item_1.qty) * parseInt(sub_item_2.qty) * parseInt(sub_item_3.qty), need_by_date);
//                     } else {
//                       const bomDetails4 = await cache.request(`resource/BOM/${sub_item_3_data.default_bom}`, getFrappeJson);
//                       for (const key in bomDetails4.items) {
//                         const sub_item_4 = bomDetails4.items[key];
//                         let sub_item_4_data = await cache.request(`resource/Item/${sub_item_4.item_code}`, getFrappeJson);
//                         // push the required amount of items to the list, if the item doesnt exist it will be added
//                         item_report_list.pushCount(sub_item_4.item_code, parseInt(sales_order_item.qty) * parseInt(sub_item_1.qty) * parseInt(sub_item_2.qty) * parseInt(sub_item_3.qty) * parseInt(sub_item_4.qty), need_by_date);
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//         // // get the details of the bom given the name in the item
//         // if(!sales_order_item.hasOwnProperty('bom_no')){
//         //   item_report_list.pushCount(sales_order_item.item_code, parseInt(sales_order_item.qty), need_by_date);
//         // } else {
//         //   const bomDetails = await cache.request(`resource/BOM/${sales_order_item.bom_no}`, getFrappeJson);
//         //   for (const key in bomDetails.items) {
//         //     const item = bomDetails.items[key];
//         //     // push the required amount of items to the list, if the item doesnt exist it will be added
//         //     item_report_list.pushCount(item.item_code, parseInt(item.qty * sales_order_item.qty), need_by_date);
//         //   }
//         // }
//       }
//     }
  
//     itemsLoaded = 0;
//     await item_report_list.fill_all();
  
//     item_report_list.remove_items_not_included();

//     console.timeEnd('getItemReportFromDatabase');
  
//     return item_report_list.getJSONArray()
//   }

function convertFrappeDateToDate(date_from_server) {
  let dateArray = date_from_server.split("-");
  let date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
  return date;
}

async function getFrappeJson(apiPath) {
  let response = await fetch("/api/" + apiPath)
  if (response.status != 200) {
    return null;
  }
  let json = await response.json()
  if (json.hasOwnProperty('message')) {
    return json.message
  } else {
    return json.data
  }

}

function getDaysBetweenDates(date_past, date_future) {
  const diffTime = date_future - date_past;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getDaysBetweenDatesAbs(date_past, date_future) {
  const diffTime = Math.abs(date_future - date_past);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
