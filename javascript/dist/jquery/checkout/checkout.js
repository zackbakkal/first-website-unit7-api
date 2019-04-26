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

var formData;
var countries;
var countryCode;
var provinces;
var states;
var cities;


/*
* This function is fired after the document is ready
*/
$(function () {
    // load the json files
    $.fn.loadJsonFiles();

    // load the shopping cart object
    myCart = new Cart();
    myCart.loadCart(JSON.parse(localStorage.getItem("mycart")));
    // when the continue button is clicked process the order bt
    // calling the paypal API
    $("#checkout").click(function () {
        // clear the old elements
        $("#checkout").empty();
        // add a prompt text
        $("#checkout").append("<p>Please choose your payment method</p>").css("text-align", "center");
        // add the paypal checkout button
        $("#checkout").append("<div></div>");
        $("#checkout div").attr("id", "paypal-button-container");
        $.fn.processOrder();
    });

    // if the cancel button is clicked return to shopping cart page
    $("#cancel").click(function () {
        window.open("Cart.html", "_self");
    });
});

$.fn.loadJsonFiles = function () {
    $.fn.loadLocation("#country", "json/countrynamecode.json", null);

    $("#country").blur(function () {
        $("#city").empty();
        $("#city").append("<option value=\"" + "Select One" + "\">" + "Select One" + "</option>");
        $.fn.loadLocation("#city", "json/countriescities.json", $("#country").val());
        if ($("#country").val() == "United States") {
            states = $.fn.loadLocation("#province", "json/states.json", null);
        } else if ($("#country").val() == "Canada") {
            $.fn.loadLocation("#province", "json/province.json", null);
        } else {
            $("#province").empty();
            $("#province").append("<option value=\"" + "Select One" + "\">" + "Select One" + "</option>");
        }
    });

};

$.fn.loadLocation = function (id, fileName, country) {
    try {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                // read the response
                var entries = JSON.parse(xhr.responseText);

                if (country) {
                    // retrieve the country's cities from countriescities.json
                    entries = entries[country];
                    $(id).empty();
                    $(id).append("<option value=\"" + "Select One" + "\">" + "Select One" + "</option>");
                    entries.forEach(function (entry) {
                        $(id).append("<option value=\"" + entry + "\">" + entry + "</option>");
                    });

                } else {

                    // this is needed for the country code in the API
                    if (id == "#country") {
                        countries = entries;
                    }

                    $(id).empty();
                    $(id).append("<option value=\"" + "Select One" + "\">" + "Select One" + "</option>");
                    entries.forEach(function (entry) {
                        $(id).append("<option value=\"" + entry.name + "\">" + entry.name + "</option>");
                    });
                }
            }
        };
    } catch (exception) {
        alert("Something went wrong");
    }

    xhr.open("GET", fileName, true);
    xhr.send(null);
}

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
                        "given_name": $("#checkoutform #first").val(),
                        "surname": $("#checkoutform #last").val()
                    },
                    "email_address": $("#checkoutform #email").val(),
                    "address": {
                        "address_line_1": $("#checkoutform #line1").val(),
                        "address_line_2": $("#checkoutform #line2").val(),
                        "admin_area_2": $("#checkoutform #city").val(),
                        "admin_area_1": $("#checkoutform #province").val(),
                        "postal_code": $("#checkoutform #zip").val(),
                        "country_code": countries[$("#checkoutform #country").val()].code
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
                                "full_name": $("#checkoutform #first").val() + " " + $("#checkoutform #last").val()
                            },
                            "option": {
                                "shipping_option": {
                                    "id": "",
                                    "label": "",
                                    "type": "SHIPPING",
                                    "amount": {
                                        "currency_code": "CA",
                                        "value": "0"
                                    },
                                    "selected": "true",
                                },
                                "address": {
                                    "address_line_1": $("#checkoutform #line1").val(),
                                    "address_line_2": $("#checkoutform #line2").val(),
                                    "admin_area_2": $("#checkoutform #city").val(),
                                    "admin_area_1": $("#checkoutform #province").val(),
                                    "postal_code": $("#checkoutform #zip").val(),
                                    "country_code": countries[$("#checkoutform #country").val()].code
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