async function getItemReportFromDatabase() {

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

  class Item_report {
    constructor(item_code, date_from_server) {
      this.flag = null;
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
      this.is_included_in_manu = true;

      this.req_parts = new Array();
      this.parts_calendar = null;
    }

    fill_item_report = async function () {
      //get item name and lead time from item doctype
      let item = await getFrappeJson(`resource/Item/${this.item_code}`);
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
      


      //get last PO for order
      let last_po = await getFrappeJson(`resource/Purchase Order?filters=[["Purchase Order Item","item_code","=","${this.item_code}"]]&limit=1`)
      if (last_po.length > 0) {
        this.last_PO = last_po[0].name;
      } else {
        this.last_PO = "N/A";
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
        order_date.setDate(server_date.getDate() + daysUntilOrder);
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
        if (daysUntilOrder <= 0) {
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
      for (let i = 0; i < this.req_parts.length; i++) {
        let tempDay = new Date(this.server_date);
        tempDay.setDate(this.server_date.getDate() + i);
        let current_month = tempDay.getMonth();
        if(this.req_parts[i] > 0) {
          parts_per_month[current_month] += this.req_parts[i]
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
          this.parts_calendar[month_no] = [month_no, parts_per_month[month_no], "gray"];
        }

        if(month_no == inv_until_month) {
          inv_months_finished = true;
        }
        if(month_no == lead_time_months) {
          lead_months_finished = true;
        }
        
      }
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

  // get the date from the server so that it is timezone independent for the client
  let frappe_server_date = await getFrappeJson("method/droplet_inv_dash.droplet_inv_dash.doctype.servertime.server_date")
  if (frappe_server_date == null) {
    console.log("not signed in")
    return;
  }
  let server_date = convertFrappeDateToDate(frappe_server_date);

  // pass the item report the date it was created at, get this date from the server
  let item_report_list = new Item_report_list(server_date);

  // instantiate a cache 
  let cache = new Cache_api()


  // customer_name, delivery_date, items, filter by delivery_status
  // this has to be done as multiple requests as "items" list is not a valid field while accessing bulk document data. see api/resource/Sales%20Order?fields=["*"]
  const sales_orders = await getFrappeJson(`resource/Sales Order?filters=[["Sales Order","delivery_status","=","Not Delivered"]]`);
  for (const key in sales_orders) {
   // delivery_date, items list from the above list of orders
    const sales_order = await getFrappeJson(`resource/Sales Order/${sales_orders[key].name}`);
    const sales_order_item_list = sales_order.items
    for (const key in sales_order_item_list) {
      const sales_order_item = sales_order_item_list[key];
      // amount, bom_no, item_code
      // TODO: use the items lead time to calculate when the parts actually have to arrive, for now subtract 14 days from delivery date
      let item_lead_time = document.getElementById("item_lead_time").value;
      let delivery_date = convertFrappeDateToDate(sales_order_item.delivery_date);
      let need_by_date = new Date();
      let todays_date = server_date;
      need_by_date.setDate(delivery_date.getDate() - item_lead_time);
      if (todays_date > need_by_date) {
        need_by_date = todays_date;
      }

      // get the details of the bom given the name in the item
      if(!sales_order_item.hasOwnProperty('bom_no')){
        item_report_list.pushCount(sales_order_item.item_code, parseInt(sales_order_item.qty), need_by_date);
      } else {
        const bomDetails = await cache.request(`resource/BOM/${sales_order_item.bom_no}`, getFrappeJson);
        for (const key in bomDetails.items) {
          const item = bomDetails.items[key];
          // push the required amount of items to the list, if the item doesnt exist it will be added
          item_report_list.pushCount(item.item_code, parseInt(item.qty * sales_order_item.qty), need_by_date);
        }
      }
    }
  }


  await item_report_list.fill_all();

  item_report_list.remove_items_not_included();

  return item_report_list.getJSONArray()
}

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