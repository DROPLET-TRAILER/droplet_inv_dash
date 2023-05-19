let current_report = {};

let calendar = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

setInterval(update_timer_since_last_update, 60000);
let minElapsed = 0;

let itemsLoaded = 0;

function set_ID_drop_down() {
    let numberOfJsonItems = current_report.length;
    let itemNames = new Array(numberOfJsonItems);
    let selectTagToAdd = document.createElement("select");
    selectTagToAdd.setAttribute("id", "dropDown");

    for (let i = 0; i < numberOfJsonItems; ++i) {
        let words = current_report[i].item.split(" ");
        itemNames[i] = words[0];
        //sort itemNames in order

        // let optionToAdd = document.createElement("option");
        // optionToAdd.innerHTML = itemNames[i];
        // optionToAdd.setAttribute("value", "#row" + i);
        // optionToAdd.setAttribute("index", i);
        // selectTagToAdd.appendChild(optionToAdd);
    }

    let sortedArray = [...itemNames];
    sortedArray = sortedArray.sort((a, b) => a - b);

    for (let i = 0; i < numberOfJsonItems; ++i) {
        let optionToAdd = document.createElement("option");
        optionToAdd.innerHTML = sortedArray[i];

        for (let j = 0; j < numberOfJsonItems; ++j) {
            if (current_report[j].item.split(" ")[0] == sortedArray[i]) {
                optionToAdd.setAttribute("value", "#row" + current_report[j].item_code);
                optionToAdd.setAttribute("index", current_report[j].item_code);
                selectTagToAdd.appendChild(optionToAdd);
                break;
            }
        }
        // optionToAdd.setAttribute("value", "#row" + i);
        // optionToAdd.setAttribute("index", i);
        // selectTagToAdd.appendChild(optionToAdd);
    }
    $("#dropDownOverview").replaceWith(selectTagToAdd);
}

function showTable(counter) {
    let elementID = "weekView" + counter;
    document.getElementById(elementID).setAttribute("style", "display: visible");
}

function formatAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    let strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

function get_todays_date() {
    let current = document.getElementById("current");
    let today = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    current.innerHTML = "Last Updated: " + today.toLocaleDateString(undefined, options) +
        " at " + formatAMPM(today);
}

function fillTable() {
    let jsonArray = current_report;
    let numOfJsonOb = jsonArray.length;

    if (numOfJsonOb === 0) {
        let table = document.getElementById("MainTable");
        let row = table.insertRow(1);

        let item = row.insertCell(0);
        let total_req = row.insertCell(1);
        let current_inv = row.insertCell(2);
        let lead_time = row.insertCell(3);
        let lead_time_qty = row.insertCell(4);
        let order_qty = row.insertCell(5);
        let order_date = row.insertCell(6);
        let PO = row.insertCell(7);

        item.innerHTML = "N/A";
        total_req.innerHTML = "N/A";
        current_inv.innerHTML = "N/A";
        lead_time.innerHTML = "N/A";
        lead_time_qty.innerHTML = "N/A";
        order_qty.innerHTML = "N/A";
        order_date.innerHTML = "N/A";
        PO.innerHTML = "N/A";
    } else {

        for (let i = 0; i < numOfJsonOb; ++i) {
            let table = document.getElementById("MainTable");
            let row = table.insertRow(1);
            row.setAttribute("id", "row" + current_report[i].item_code);
            row.setAttribute("class", "row-" + jsonArray[i].flag);
            row.addEventListener('click', function (e) {
                if (weekView.style.display === "none") {
                    weekView.setAttribute("style", "display: visible");
                } else {
                    weekView.setAttribute("style", "display: none");
                }
            });
            row.setAttribute("style", "cursor: pointer; cursor: hand;");

            let item = row.insertCell(0);
            let total_req = row.insertCell(1);
            let current_inv = row.insertCell(2);
            let lead_time = row.insertCell(3);
            let lead_time_qty = row.insertCell(4);
            let order_date = row.insertCell(5);
            let future_order_qty = row.insertCell(6);
            let incoming_qty = row.insertCell(7);
            let PO = row.insertCell(8);

            item.innerText = jsonArray[i].item;
            total_req.innerHTML = jsonArray[i].total_req;
            current_inv.innerHTML = jsonArray[i].current_inv;
            lead_time.innerHTML = jsonArray[i].lead_time;
            lead_time_qty.innerHTML = jsonArray[i].lead_time_qty;
            incoming_qty.innerHTML = jsonArray[i].incoming_qty;
            order_date.innerHTML = jsonArray[i].order_date;
            PO.innerHTML = jsonArray[i].PO;
            future_order_qty.innerHTML = jsonArray[i].order_qty

            let weekView = document.createElement("td");
            weekView.setAttribute("id", "weekView" + current_report[i].item_code);
            weekView.setAttribute("colspan", "8");
            weekView.setAttribute("class", "table-bordered");
            weekView.setAttribute("style", "display:none;");

            row = table.insertRow(2);
            row.appendChild(weekView);
            getWeekView(i, weekView);
        }
    }
}


function getWeekView(itemIndex, weekView) {
    let jsonArray = current_report;

    let tableToAdd = document.createElement('table');
    let itemArray = jsonArray[itemIndex];
    // Creating the row for month headers
    //Set the Monthly Header
    let monthHeader = tableToAdd.insertRow(0);
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();

    // Creating calender table with the given Item Array
    let empty = document.createElement('th');
    empty.setAttribute("class", "gray");
    monthHeader.appendChild(empty);
    for (let i = currentMonth; i < 12; ++i) {
        let cell = document.createElement('th');
        cell.setAttribute("class", "gray");
        cell.innerText = calendar[i];
        monthHeader.appendChild(cell);
    }

    for (let i = 0; i < currentMonth; ++i) {
        let cell = document.createElement('th');
        cell.setAttribute("class", "gray");
        cell.innerText = calendar[i];
        monthHeader.appendChild(cell);
    }

    // Creating the row for initial inventory stock
    let initial_inventory_info = tableToAdd.insertRow(1);

    let initial_inventory = document.createElement("th");
    initial_inventory.setAttribute("class", "gray");
    initial_inventory.innerText = "Initial Inventory";
    initial_inventory_info.appendChild(initial_inventory);
    
    // for (let j = 0; j < currentMonth; ++j) {
    //     let cell = document.createElement("td");
    //     cell.setAttribute("class", jsonArray[itemIndex].initial_inventory[j][1]);
    //     cell.innerHTML = jsonArray[itemIndex].initial_inventory[j][0];
    //     calendarInfo.appendChild(cell);
    // }
    for (let j = currentMonth; j < 12; ++j) {
        //console.log("Arrived here3");
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].current_stock[j][2]);
        cell.innerHTML = jsonArray[itemIndex].current_stock[j][1];
        initial_inventory_info.appendChild(cell);
    }

    for (let j = 0; j < currentMonth; ++j) {
        //console.log("Arrived here3");
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].current_stock[j][2]);
        cell.innerHTML = jsonArray[itemIndex].current_stock[j][1];
        initial_inventory_info.appendChild(cell);
    }

    // Get the data and set the calendar
    // Creating the row for required stocks
    let calendarInfo = tableToAdd.insertRow(2);

    let required = document.createElement("th");
    required.setAttribute("class", "gray");
    required.innerText = "Required";
    calendarInfo.appendChild(required);

    // Old code from the previous group. Doesn't count calendar based on the month, counts based on ALL months.
    // for (let j = currentMonth; j < 12; ++j) {
    //     //console.log("Arrived here3");
    //     let cell = document.createElement("td");
    //     cell.setAttribute("class", jsonArray[itemIndex].parts_calendar[j][2]);
    //     cell.innerHTML = jsonArray[itemIndex].parts_calendar[j][1];
    //     calendarInfo.appendChild(cell);
    // }

    // for (let j = 0; j < currentMonth; ++j) {
    //     //console.log("Arrived here3");
    //     let cell = document.createElement("td");
    //     cell.setAttribute("class", jsonArray[itemIndex].parts_calendar[j][2]);
    //     cell.innerHTML = jsonArray[itemIndex].parts_calendar[j][1];
    //     calendarInfo.appendChild(cell);
    // }

    // Code to display the required qty's of each item. Counts from all work orders that include that item
    for (let j = currentMonth; j < 12; ++j) {
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].required_list[j]);
        cell.innerHTML = jsonArray[itemIndex].required_list[j];
        calendarInfo.appendChild(cell);
    }

    for (let j = 0; j < currentMonth; ++j) {
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].required_list[j]);
        cell.innerHTML = jsonArray[itemIndex].required_list[j];
        calendarInfo.appendChild(cell);
    }

    // Creating the row for stock
    let safetyStockInfo = tableToAdd.insertRow(3);
    let safetyStock = document.createElement("th");
    safetyStock.setAttribute("class", "gray");
    safetyStock.innerText = "Safety Stock";
    safetyStockInfo.appendChild(safetyStock);
    for (let j = currentMonth; j < 12; ++j) {
        //console.log("Arrived here3");
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].safetyStock);
        cell.innerHTML = jsonArray[itemIndex].safety_stock;
        safetyStockInfo.appendChild(cell);
    }

    for (let j = 0; j < currentMonth; ++j) {
        //console.log("Arrived here3");
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].safetyStock);
        cell.innerHTML = jsonArray[itemIndex].safety_stock;
        safetyStockInfo.appendChild(cell);
    }

    // Creating the row for "To Order"
    let toOrderInfo = tableToAdd.insertRow(4);
    let toOrder = document.createElement("th");
    toOrder.setAttribute("class", "gray");
    toOrder.innerText = "To Order";
    toOrderInfo.appendChild(toOrder);

    for (let j = currentMonth; j < 12; ++j) {
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].to_order[j][2]);
        cell.innerHTML = jsonArray[itemIndex].to_order[j][1];
        toOrderInfo.appendChild(cell);
    }

    for (let j = 0; j < currentMonth; ++j) {
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].to_order[j][2]);
        cell.innerHTML = jsonArray[itemIndex].to_order[j][1];
        // cell.setAttribute("class", jsonArray[itemIndex].to_order);
        // cell.innerHTML = jsonArray[itemIndex].to_order;
        toOrderInfo.appendChild(cell);
    }

    // Creating the row for "To Order Date"
    let toOrderDateInfo = tableToAdd.insertRow(5);
    let toOrderDate = document.createElement("th");
    toOrderDate.setAttribute("class", "gray");
    toOrderDate.innerText = "To Order Date";
    toOrderDateInfo.appendChild(toOrderDate);
    var options = { month: 'short', day: 'numeric' }; // To Format Date as "May 16". Add year: 'numeric', if required

    for (let j = currentMonth; j < 12; ++j) {
        let cell = document.createElement("td");
        if (!jsonArray[itemIndex].order_by_date[j]) {
            cell.setAttribute("class", "n/a")
            cell.innerHTML = ""
        } else {
            let displayed_date = jsonArray[itemIndex].order_by_date[j][0];
            cell.setAttribute("class", displayed_date);
            displayed_date.setDate(displayed_date.getDate() - 14 - jsonArray[itemIndex].lead_time);
            cell.innerHTML = displayed_date.toLocaleDateString("en-US", options);
        }
        toOrderDateInfo.appendChild(cell);
    }

    for (let j = 0; j < currentMonth; ++j) {
        let cell = document.createElement("td");
        if (!jsonArray[itemIndex].order_by_date[j]) {
            cell.setAttribute("class", "n/a")
            cell.innerHTML = ""
        } else {
            let displayed_date = jsonArray[itemIndex].order_by_date[j][0];
            cell.setAttribute("class", displayed_date);
            displayed_date.setDate(displayed_date.getDate() - 14 - jsonArray[itemIndex].lead_time);
            cell.innerHTML = displayed_date.toLocaleDateString("en-US", options);
        }
        toOrderDateInfo.appendChild(cell);
    }

    // Create a row for work order lists to be ordered
    let workOrderInfo = tableToAdd.insertRow(5);
    let workOrders = document.createElement("th");
    workOrders.setAttribute("class", "gray");
    workOrders.innerText = "Work Orders"
    workOrderInfo.appendChild(workOrders);

    // Populate work orders into table data
    for (let j = currentMonth; j < 12; ++j) {
        let cell = document.createElement("td");
        cell.setAttribute("class", "gray")
        if (jsonArray[itemIndex].work_order_list[j]) {
            for (let k = 0; k < jsonArray[itemIndex].work_order_list[j].length; k++) {
                let work_order_link = document.createElement("button");
                work_order_link.innerText = jsonArray[itemIndex].work_order_list[j][k];
                work_order_link.setAttribute("onclick", `location.href = '/app/work-order/${jsonArray[itemIndex].work_order_list[j][k]}'`)
                work_order_link.setAttribute("id", "info_button")
                cell.appendChild(work_order_link);
            } 
        } else {
            cell.innerHTML = ""
        }
        workOrderInfo.appendChild(cell);
    }

    for (let j = 0; j < currentMonth; ++j) {
        let cell = document.createElement("td");
        cell.setAttribute("class", "gray")
        if (jsonArray[itemIndex].work_order_list[j]) {
            for (let k = 0; k < jsonArray[itemIndex].work_order_list[j].length; k++) {
                let work_order_link = document.createElement("button");
                work_order_link.innerText = jsonArray[itemIndex].work_order_list[j][k];
                work_order_link.setAttribute("onclick", `location.href = '/app/work-order/${jsonArray[itemIndex].work_order_list[j][k]}'`)
                work_order_link.setAttribute("id", "info_button");
                cell.appendChild(work_order_link);
            }
        } else {
            cell.innerHTML = ""
        }
        workOrderInfo.appendChild(cell);
    }

    // Creating the row for ordered stock
    let orderedStockInfo = tableToAdd.insertRow(6);
    let ordered = document.createElement("th");
    ordered.setAttribute("class", "gray");
    ordered.innerText = "Ordered";
    orderedStockInfo.appendChild(ordered);

    for (let j = currentMonth; j < 12; ++j) {
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].ordered[j]);
        cell.innerHTML = jsonArray[itemIndex].ordered[j];
        orderedStockInfo.appendChild(cell);
    }

    for (let j = 0; j < currentMonth; ++j) {
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].ordered[j]);
        cell.innerHTML = jsonArray[itemIndex].ordered[j];
        // cell.setAttribute("class", jsonArray[itemIndex].to_order);
        // cell.innerHTML = jsonArray[itemIndex].to_order;
        orderedStockInfo.appendChild(cell);
    }

    // Creating the row for forecast stock (back order)
    let backOrderInfo = tableToAdd.insertRow(7);
    let backOrder = document.createElement("th");
    backOrder.setAttribute("class", "gray");
    backOrder.innerText = "Forecast Inventory";
    backOrderInfo.appendChild(backOrder);

    // console.log(jsonArray);
    // Create table data for back order row
    for (let j = currentMonth; j < 12; ++j) {
        //console.log("Arrived here3");
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].back_order[j][1]);
        cell.innerHTML = jsonArray[itemIndex].back_order[j][1];
        backOrderInfo.appendChild(cell);
    }

    for (let j = 0; j < currentMonth; ++j) {
        //console.log("Arrived here3");
        let cell = document.createElement("td");
        cell.setAttribute("class", jsonArray[itemIndex].back_order[j][1]);
        cell.innerHTML = jsonArray[itemIndex].back_order[j][1];
        backOrderInfo.appendChild(cell);
    }

    weekView.appendChild(tableToAdd);
    return;
}

function init_timer_update() {
    let current = document.getElementById("current");
    minElapsed = 0;
    current.innerHTML = "Last Updated: " + minElapsed + " minutes ago";
}

function update_timer_since_last_update() {
    minElapsed++;
    let current = document.getElementById("current");
    current.innerHTML = "Last Updated: " + minElapsed + " minutes ago";
}

function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
          _x += el.offsetLeft - el.scrollLeft;
          _y += el.offsetTop - el.scrollTop;
          el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

// Call this function like you would a counter. ++ every time you finish loading
// an item.
// Parameters --> Give it the maximum number of items that will be loaded
function setProgressBarCount(maximumItems) {
    itemsLoaded++;

    if (itemsLoaded > maximumItems) {
        itemsLoaded = maximumItems;
    }

    let percentageComplete = (itemsLoaded / maximumItems) * 100;
    let progressBar = document.getElementById('progress_bar');
    progressBar.innerHTML = itemsLoaded + "/" + maximumItems;
    progressBar.style.width = percentageComplete + '%';
}

frappe.ready(async function () {
    //frappePostRequest()
    // get_todays_date();
    init_timer_update();

    //fillTable();
    await fillTableDriver();

    document.getElementById('refreshButton').addEventListener('click', function (e) {
        // fillTable();
        itemsLoaded = -1;
        fillTableDriver();
        init_timer_update();
    });

    //For Total Req
    let numOfTotalReqButtonClicked = true;
    document.getElementById('sortTotalReqButton').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        clearTable(table);
        current_report = bubbleSort(current_report, lowestTotalReq);

        if (numOfTotalReqButtonClicked) {
            fillTable();
            numOfTotalReqButtonClicked = false;
        } else {
            //Reverse the current_report
            current_report.reverse();
            fillTable();
            numOfTotalReqButtonClicked = true;
        }

    });

    //For Current Inv
    let numOfCurrentInvButtonClicked = 0;
    document.getElementById('sortCurrentInvButton').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        clearTable(table);
        current_report = bubbleSort(current_report, lowestcurrentInv);

        if (numOfCurrentInvButtonClicked % 2 === 0) {
            fillTable();
            numOfCurrentInvButtonClicked++;
        } else {
            //Reverse the current_report
            current_report.reverse();
            fillTable();
            numOfCurrentInvButtonClicked++;
        }

    });

    //For Lead Time
    let numOfLeadTimeButtonClicked = 0;
    document.getElementById('sortLeadTimeButton').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        clearTable(table);
        current_report = bubbleSort(current_report, lowestLeadTime);

        if (numOfLeadTimeButtonClicked % 2 === 0) {
            fillTable();
            numOfLeadTimeButtonClicked++;
        } else {
            //Reverse the current_report
            current_report.reverse();
            fillTable();
            numOfLeadTimeButtonClicked++;
        }

    });

    //For Lead Time Quantity
    let numOfLeadTimeQtyButtonClicked = 0;
    document.getElementById('sortLeadTimeQty').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        clearTable(table);
        current_report = bubbleSort(current_report, lowestNextInv);

        if (numOfLeadTimeQtyButtonClicked % 2 === 0) {
            fillTable();
            numOfLeadTimeQtyButtonClicked++;
        } else {
            //Reverse the current_report
            current_report.reverse();
            fillTable();
            numOfLeadTimeQtyButtonClicked++;
        }

    });

    //For Order Date
    let numOfOrderDateButtonClicked = 0;
    document.getElementById('sortByDate').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        if (numOfOrderDateButtonClicked % 2 === 0) {
            clearTable(table);
            current_report = bubbleSort(current_report, orderDateAsc);
            fillTable();
            numOfOrderDateButtonClicked++;
        } else {
            clearTable(table);
            current_report = bubbleSort(current_report, orderDateDesc);
            fillTable();
            numOfOrderDateButtonClicked++;
        }

    });

    //For Future Quantity
    let numOfFutureQtyButtonClicked = 0;
    document.getElementById('sortByFutureOrder').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        clearTable(table);
        current_report = bubbleSort(current_report, lowestFutureOrder);

        if (numOfFutureQtyButtonClicked % 2 === 0) {
            fillTable();
            numOfFutureQtyButtonClicked++;
        } else {
            //Reverse the current_report
            current_report.reverse();
            fillTable();
            numOfFutureQtyButtonClicked++;
        }

    });

    //For Incoming Quantity
    let numOfIncomingQtyButtonClicked = 0;
    document.getElementById('sortIncomingQty').addEventListener('click', function (e) {
        let table = document.getElementById("MainTable");
        clearTable(table);
        current_report = bubbleSort(current_report, lowestIncomingQty);

        if (numOfIncomingQtyButtonClicked % 2 === 0) {
            fillTable();
            numOfIncomingQtyButtonClicked++;
        } else {
            //Reverse the current_report
            current_report.reverse();
            fillTable();
            numOfIncomingQtyButtonClicked++;
        }

    });

});


function clearTable(table) {
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
}

// refrenced and modified from https://flexiple.com/bubble-sort-javascript/
function bubbleSort(jsonArray, compareFunction) {
    let len = jsonArray.length - 1;
    let modified;
    do {
        modified = false;
        for (let i = 0; i < len; i++) {
            if (compareFunction(jsonArray[i], jsonArray[i + 1])) {
                let tmp = jsonArray[i];
                jsonArray[i] = jsonArray[i + 1];
                jsonArray[i + 1] = tmp;
                modified = true;
            }
        }
    } while (modified);
    return jsonArray;
};


function orderDateAsc(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.order_date > jsonObjectTwo.order_date;
}

function orderDateDesc(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.order_date < jsonObjectTwo.order_date;
}

function lowestTotalReq(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.total_req < jsonObjectTwo.total_req;
}

function lowestcurrentInv(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.current_inv < jsonObjectTwo.current_inv;
}

function lowestLeadTime(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.lead_time < jsonObjectTwo.lead_time;
}

function lowestNextInv(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.lead_time_qty < jsonObjectTwo.lead_time_qty;
}

function lowestFutureOrder(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.order_qty < jsonObjectTwo.order_qty;
}

function lowestIncomingQty(jsonObjectOne, jsonObjectTwo) {
    return jsonObjectOne.incoming_qty < jsonObjectTwo.incoming_qty;
}

async function sortAndRefreshTable(sortingFunction) {
    let table = document.getElementById("MainTable");
    clearTable(table)
    let sorted_report = bubbleSort(current_report, sortingFunction);
    fillTable(sorted_report);
}

async function fillTableDriver() {
    let table = document.getElementById("MainTable");
    clearTable(table)
    let row = table.insertRow(1);
    row.classList.add("loadingIcon");
    row.innerHTML = `<td class="loadingIconParent" colspan="8"><i class="loadingIcon fas fa-spinner fa-spin fa-5x"></i></td>`;
    current_report = await getItemReportFromDatabase();
    let sorted_report = bubbleSort(current_report, orderDateDesc);
    clearTable(table);
    fillTable(sorted_report);

    // create drop down menu for items
    set_ID_drop_down();
    let dropDownMenu = document.getElementById("dropDown");
    dropDownMenu.onchange = function () {
        // window.scrollTo(0, 0);
        // let hrefTogo = this.value;
        // let index = this.options[this.selectedIndex].getAttribute('index');
        // setTimeout(function() {
        //     window.location.href = hrefTogo;
        //     showTable(index);
        // }, 1000);

        document.documentElement.scrollTop = 0;
        window.location.href = this.value;
        tableHeader
        let testRowPos = document.getElementById(this.value.substring(1));
        console.log(testRowPos.offsetTop);
        let index = this.options[this.selectedIndex].getAttribute('index');
        showTable(index);
        if (index > current_report.length - 5) {
            window.scrollBy(0, -250);
        }
        // $('html').animate({scrollTop: $(this.value).offset().top}, slow);
        // let index = this.options[this.selectedIndex].getAttribute('index');
        // showTable(index);
    };


    // set_ID_drop_down();
    // let dropDownMenu = document.getElementById("dropDown");
    // let topOfDashboard = document.getElementById("page-card");
    // let topPos = topOfDashboard.offsetTop;

    // dropDownMenu.onchange = function () {
    //     // window.scrollTo(0, 0);
    //     // let hrefTogo = this.value;
    //     // let index = this.options[this.selectedIndex].getAttribute('index');
    //     // setTimeout(function() {
    //     //     window.location.href = hrefTogo;
    //     //     showTable(index);
    //     // }, 1000);

    //     let elem = document.querySelector(this.value);
    //     let selectedElement = elem.getBoundingClientRect();
    //     console.log(selectedElement);

    //     let x = getOffset(document.getElementById(this.value)).left;
    //     let y = getOffset(document.getElementById(this.value)).top;

    //     console.log("x: "+ x);
    //     console.log("y: "+ y);

    //     // window.scrollTo(selectedElement.x, selectedElement.y + topOfDashboard);

    //     // window.location.href = this.value;
    //     let index = this.options[this.selectedIndex].getAttribute('index');
    //     showTable(index);
    // };
}