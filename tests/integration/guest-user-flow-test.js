import startApp from '../helpers/start-app';
import Testing from "../helpers/testing";

import checkElements from "../helpers/check-elements";
import createObjects from "../helpers/create-objects";
import helpers from "../helpers/helpers";

import Models from "../helpers/models";

var App, Adapter;

module('Integration - Guest', {
	setup: function() {
		App = startApp();
		Adapter = App.__container__.lookup("adapter:main");
		Testing.setupMarketplace();
	},
	teardown: function() {
		Ember.run(App, 'destroy');
	}
});

test('visiting start creates a marketplace', function() {
	visit('/start')
		.then(function() {
			var session = BalancedApp.__container__.lookup("controller:sessions");

			deepEqual(session.getProperties("isUserGuest", "isUserPresent"), {
				isUserPresent: true,
				isUserGuest: true
			});
		});
});

test('viewing settings page as guest, can view api secret key', function() {
	visit('/marketplaces/' + Testing.MARKETPLACE_ID)
		.then(function() {
			var marketplace = BalancedApp.__container__.lookup("controller:marketplace").get("model");
			Ember.run(function() {
				var customer = Models.Customer.create();
				marketplace.set("owner_customer", customer);
			});
		})
		.click('#marketplace-nav i.icon-my-marketplace')
		.click('#marketplace-nav a:contains(Settings)')
		.click('.create-api-key-btn')
		.then(function() {
			var shown_api_secret_key = $('.api-key-secret').text().trim();

			ok(shown_api_secret_key, sinon.match(/^ak\-test/), 'shown api secret in settings for guest');
		});
});

test('claim account creates a login', function() {
	var stub;

	var emailAddress = 'marshall@example.com',
		password = 'SupahSecret123~!';

	visit('/start')
		.checkElements({
			"#account-create h2": "Balanced Dashboard",
			"#account-create .form-section h3": "Create your account"
		})
		.fillForm("#account-create", {
			email_address: emailAddress,
			password: password,
			passwordConfirm: password
		})
		.then(function() {
			stub = sinon.stub(jQuery, "ajax");
			stub.returns(Ember.RSVP.resolve({
				uri: "",
			}));
		})
		.click('#account-create [name=modal-submit]')
		.then(function() {
			var request = stub.args[0][0];
			matchesProperties(request, {
				type: "POST",
				url: "https://auth.balancedpayments.com/users"
				data: {
					"email_address": "marshall@example.com",
					"password": "SupahSecret123~!",
					"passwordConfirm": "SupahSecret123~!"
				}
			});
			stub.restore();
		});
});
