/**
 * File Name: chekcout.js
 * Author: Zakaria Bakkal
 * Version: 1
 * Date: April 25, 2019
 * Description: This script handles the checkout process of the
 *              customer's order.
 */

var items;      // holds the items info
var xhr;        // holds the XMLHttpRequest object
var myCart;     // holds the shopping cart data
var itemsArray; // used for holding the json object foir items info

/*
* This function is fired after the document is ready
*/
$(function () {
    // load the shopping cart object
    myCart = new Cart();
    myCart.loadCart(JSON.parse(localStorage.getItem("mycart")));

    // when the continue button is clicked process the order bt
    // calling the paypal API
    $("#checkout").click(function () {
        // clear the old elements
        $("#checkout").empty();
        // add a prompt text
        $("#checkout").append("<p></p>").text("Please choose your payment method").css("text-align", "center");
        // add the paypal checkout button
        $("#checkout").append("<div></div>").attr("id", "paypal-button-container");
        $.fn.processOrder();
    });

    // if the cancel button is clicked return to shopping cart page
    $("#cancel").click(function () {
        window.open("Cart.html", "_self");
    });
});

/*
* Processes the customer order
*/
$.fn.processOrder = function () {
    // retrieve items info to fill the order JSON object for the order
    try {
        xhr = new XMLHttpRequest();     // create the XMLHttpRequest object

        // when the request is ready fire the fucntion
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                // read the response
                var response = JSON.parse(xhr.responseText);
                // used to track the end of each item
                var counter = 0;
                // holds the item info
                items = "";
                // generate items
                myCart._rows.forEach(function (row) {
                    // generate the items
                    items += "{";
                    items += "\"name\":" + "\"" + row._product._name + "\","
                        + "\"unit_amount\":" + "{"
                        + "\"currency_code\":" + "\"CAD\","
                        + "\"value\":" + "\"" + row._product._price + "\"},"
                        + "\"quantity\":" + "\"" + row._qty + "\",";
                    switch (row._product._name) {
                        case "Argan Oil":
                            items += "\"description\":" + "\"" + response[0].description + "\","
                                + "\"SKU\":" + "\"" + response[0].SKU + "\","
                                + "\"category\":" + "\"" + response[0].category + "\"";
                            break;
                        case "Exfoliating Soap":
                            items += "\"description\":" + "\"" + response[1].description + "\","
                                + "\"SKU\":" + "\"" + response[1].SKU + "\","
                                + "\"category\":" + "\"" + response[1].category + "\"";
                            break;
                        case "Lava Clay":
                            items += "\"description\":" + "\"" + response[2].description + "\","
                                + "\"SKU\":" + "\"" + response[2].SKU + "\","
                                + "\"category\":" + "\"" + response[2].category + "\"";
                            break;
                    }
                    items += "}";
                    // just a way to figure when to add a comma
                    counter++;
                    if (counter < myCart._rows.length) {
                        items += ",";
                    }

                });

                // send the order via paypal API
                $.fn.sendOrder();
            }
            //console.log(items);
        };

    } catch (exception) {
        alert("Something went wrong");
    }

    xhr.open("GET", "json/items.json", true);
    xhr.send(null);
};

$.fn.sendOrder = function () {

    // tranform the items to a JSON object
    var itemsArray = "[" + items + "]";
    itemsArray = JSON.parse(itemsArray);

    // call paypal checkout API
    paypal.Buttons({
        // create the order
        createOrder: function (data, actions) {
            // create order on localStorage
            var order = {
                //The merchant intends to capture payment immediately after the customer makes a payment.
                "create_time": "2019-04-24T19:58:01Z",
                "id": "random",
                "intent": "CAPTURE",
                "payer": {
                    "name": {
                        "given_name": "zakaria",
                        "surname": "bakkal"
                    },
                    "email_address": "bzakki@hotmail.com",
                    "phone": {
                        "phone_type": "HOME",
                        "phone_number": {
                            "national_number": "2345678967"
                        }
                    },
                    "birth-date": "11-29-1981",
                    "address": {
                        "address_line_1": "payer address 1",
                        "address_line_2": "payer address 2",
                        "admin_area_2": "payer city",
                        "admin_area_1": "payer province",
                        "postal_code": "payer zip",
                        "country_code": "CA"
                    },
                },
                "purchase_units": [
                    {
                        "amount": {
                            "currency_code": "CAD",
                            "value": `${myCart._totalPrice}`,
                            "breakdown": {
                                "item_total": {
                                    "currency_code": "CAD",
                                    "value": `${myCart._totalPrice}`
                                }

                            }
                        },
                        "payee": {
                            "email_address": "k-bree.argan-facilitator@hotmail.com",
                        },
                        "description": "",
                        "soft_descriptor": "K-Bree",
                        "items": itemsArray,
                        "shipping": {
                            "name": {
                                "full_name": "ship to me"
                            },
                            "option": {
                                "shipping_option": {
                                    "id": "",
                                    "label": "",
                                    "type": "SHIPPING",
                                    "amount": {
                                        "currency_code": "CA",
                                        "value": ""
                                    },
                                    "selected": "true",
                                },
                                "address": {
                                    "address_line_1": "169 104 west haven",
                                    "address_line_2": "",
                                    "admin_area_2": "Leduc",
                                    "admin_area_1": "Alberta",
                                    "postal_code": "T9E0N9",
                                    "country_code": "CA"
                                },
                            }
                        },
                    }
                ]
            };

            // store the order on the localStorage
            localStorage.setItem("order", order);
            // Set up the transaction
            return actions.order.create(order);
        }
    }).render('#paypal-button-container');
};