/**
 * File Name: chekcout.js
 * Author: Zakaria Bakkal
 * Version: 1
 * Date: April 25, 2019
 * Description: This script handles the checkout process of the
 *              customer's order.
 */

var items;      // holds the items info
var myCart;     // holds the shopping cart data

var chosenCountryCode;


/*
* This function is fired after the document is ready
*/
$(function () {
    // load the json files
    $.fn.loadJsonFiles();

    // load the shopping cart object
    myCart = new Cart();
    myCart.loadCart(JSON.parse(localStorage.getItem("mycart")));
    // when the continue button is clicked process the order by
    // calling the paypal API
    $("#checkoutform").on("submit", function () {
        // check if the use selected a country
        if ($("#country").val()) {

            // clear the old elements
            $("#checkout").empty();
            // add a prompt text
            $("#checkout").append("<p></p>").text("Please choose your payment method").css("text-align", "center");
            // add the paypal checkout button
            $("#checkout").append("<div></div>");
            $("#checkout div").attr("id", "paypal-button-container");
            $.fn.processOrder();
        } else {
            $("#country").css("background-color", "red");
        }
        return false;
    });

    // if the cancel button is clicked return to shopping cart page
    $("#cancel").click(function () {
        window.open("Cart.html", "_self");
    });
});

$.fn.loadJsonFiles = function () {
    $.fn.loadLocation("#country", "json/countrynames.json", null);

    $("#country").blur(function () {
        console.log($("#country").val());
        if ($("#country").val() && $("#country").val() != "Select One Pls") {
            $(this).css("background-color", "white");
            $("#city").empty();
            $.fn.loadLocation("#city", "json/countriescities.json", $("#country").val());
            if ($(this).val() == "United States") {
                $.fn.loadLocation("#province", "json/states.json", null);
            } else if ($(this).val() == "Canada") {
                $.fn.loadLocation("#province", "json/province.json", null);
            } else {
                $("#province").empty();
            }

            // retrieve the contry code. This is important for
            // the json object sent to paypal
            $.ajax({
                type: "GET",
                url: "json/countrynamecode.json",
                success: function (data) {
                    chosenCountryCode = data[$("#country").val()];
                },
                error: function () {
                    window.alert("Unable to process your payment at this moment, please try again later");
                },
                dataType: "json"
            });
        } else {
            $(this).css("background-color", "red");
        }
    });

};

$.fn.loadLocation = function (id, fileName, country) {

    $.ajax({
        type: "GET",
        url: fileName,
        success: function (data) {

            if (country) {
                // retrieve the country's cities from countriescities.json
                data = data[country];

                $(id).empty();;
                data.forEach(function (entry) {
                    $(id).append("<option value=\"" + entry + "\">" + entry + "</option>");
                });

            } else {

                // clear the section element content
                $(id).empty();
                // add an option message
                $(id).append("<option>Select One Pls</option>");
                // iterate through the entries and add an option element fro each of them
                data.forEach(function (entry) {
                    $(id).append("<option value=\"" + entry.name + "\">" + entry.name + "</option>");
                });
            }
        },
        error: function () {
            window.alert("Unable to process your payment at this moment, please try again later");
        },
        dataType: "json"
    });
}

/*
* Processes the customer order
*/
$.fn.processOrder = function () {

    $.ajax({
        type: "GET",
        url: "json/items.json",
        success: function (data) {

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
                        items += "\"description\":" + "\"" + data[0].description + "\","
                            + "\"SKU\":" + "\"" + data[0].SKU + "\","
                            + "\"category\":" + "\"" + data[0].category + "\"";
                        break;
                    case "Exfoliating Soap":
                        items += "\"description\":" + "\"" + data[1].description + "\","
                            + "\"SKU\":" + "\"" + data[1].SKU + "\","
                            + "\"category\":" + "\"" + data[1].category + "\"";
                        break;
                    case "Lava Clay":
                        items += "\"description\":" + "\"" + data[2].description + "\","
                            + "\"SKU\":" + "\"" + data[2].SKU + "\","
                            + "\"category\":" + "\"" + data[2].category + "\"";
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
        },
        error: function () {
            window.alert("Unable to process your payment at this moment, please try again later");
        },
        dataType: "json"
    });
};

$.fn.sendOrder = function () {

    // tranform the items to a JSON object
    var itemsArray = "[" + items + "]";
    itemsArray = JSON.parse(itemsArray);

    // call paypal checkout API
    paypal.Buttons({
        // create the order
        createOrder: function (data, actions) {
            var dateCreated = new Date().toISOString();
            var id = new Date().getTime();
            console.log(dateCreated);
            // create order on localStorage
            var order = {
                //The merchant intends to capture payment immediately after the customer makes a payment.
                "create_time": dateCreated,
                "id": id,
                "intent": "CAPTURE",
                "payer": {
                    "name": {
                        "given_name": $("#first").val(),
                        "surname": $("#last").val()
                    },
                    "email_address": $("#email").val(),
                    "address": {
                        "address_line_1": $("#line1").val(),
                        "address_line_2": $("#line2").val(),
                        "admin_area_2": $("#city").val(),
                        "admin_area_1": $("#province").val(),
                        "postal_code": $("#zip").val(),
                        "country_code": chosenCountryCode
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
                                    "address_line_1": $("#line1").val(),
                                    "address_line_2": $("#line2").val(),
                                    "admin_area_2": $("#city").val(),
                                    "admin_area_1": $("#province").val(),
                                    "postal_code": $("#zip").val(),
                                    "country_code": chosenCountryCode
                                },
                            }
                        },
                    }
                ]
            };

            // store the order on the localStorage
            localStorage.setItem("order", JSON.stringify(order));
            // Set up the transaction
            return actions.order.create(order);
        },

        onApprove: function (data, actions) {
            // Capture the funds from the transaction
            return actions.order.capture().then(function (details) {
                // Show a success message to your buyer
                alert('Transaction completed by ' + details.payer.name.given_name);
                // clear the shopping cart
                myCart.clear();
                // redirect the customer to a order info page
                window.open("approved.html", "_self");
            });
        },

        onCancel: function (data) {
            window.open("checkout.html", "_self");
        },

        onError: function (err) {
            window.alert("Something went wrong, can't process your payment. Please try again later.");
        }

    }).render('#paypal-button-container');
};