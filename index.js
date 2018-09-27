const Slimbot = require('slimbot');
const express = require('express');
const request = require('request');
const debug = require('debug')('app:debug');
const app = express();
// Configure express server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => debug(`Listening on port ${PORT}`));

const slimbot = new Slimbot(process.env['TELEGRAM_BOT_TOKEN']);

var admin = '';

const roomList = [
	'Temasek Room L4 (20pax)',
	'Temasek Room L4 (20pax)',
	'Changi Room L5 (30pax)',
	'Bishan Room L6 (10pax)',
	'Orchard Room L7 (20pax)',
];

function getTodayOrTomorrowOptions() {
	return {
		parse_mode: 'Markdown',
		reply_markup: JSON.stringify({
			inline_keyboard: [
				[
					{ text: 'Today', callback_data: JSON.stringify({ date: 'Today' }) },
					{ text: 'Tomorrow', callback_data: JSON.stringify({ date: 'Tomorrow' }) },
				],
			],
		}),
	};
}

function getTimeslotOptions(date) {
	return {
		parse_mode: 'Markdown',
		reply_markup: JSON.stringify({
			inline_keyboard: [
				[
					{ text: '12:00 PM', callback_data: JSON.stringify({ date: date, time: '12:00 PM' }) },
					{ text: '13:00 PM', callback_data: JSON.stringify({ date: date, time: '13:00 PM' }) },
					{ text: '14:00 PM', callback_data: JSON.stringify({ date: date, time: '14:00 PM' }) },
					{ text: '15:00 PM', callback_data: JSON.stringify({ date: date, time: '15:00 PM' }) },
				],
			],
		}),
	};
}

function getRoomOptions(date, time) {
	return {
		parse_mode: 'Markdown',
		reply_markup: JSON.stringify({
			inline_keyboard: [
				[
					{
						text: roomList[4],
						callback_data: JSON.stringify({ date: date, time: time, room: 4 }),
					},
				],
				[
					{
						text: roomList[1],
						callback_data: JSON.stringify({ date: date, time: time, room: 1 }),
					},
				],
				[
					{
						text: roomList[2],
						callback_data: JSON.stringify({ date: date, time: time, room: 2 }),
					},
				],
				[
					{
						text: roomList[3],
						callback_data: JSON.stringify({ date: date, time: time, room: 3 }),
					},
				],
			],
		}),
	};
}

function bookingConfirmed(room, date, time, fullName, userName) {
	return `Your Booking is confirmed! \n----------------------------\nRoom: ${room}\nDate: ${date}\nTime: ${time}\nBy: ${fullName} (@${userName})`;
}

// Register listener
slimbot.on('message', message => {
	switch (message.text.trim()) {
		case '/register':
			admin = message.chat.id;
			slimbot.sendMessage(admin, 'You have registered as Admin');
			break;
		case '/start':
			startBookingRoom(message.chat.id);
			break;
	}
});

function startBookingRoom(chatId) {
	slimbot.sendMessage(chatId, 'Please select a date to book your room 😎:', getTodayOrTomorrowOptions());
}

function processBookingRoom(query) {
	var chatId = query.message.chat.id;
	let callback_data = JSON.parse(query.data);
	if (!callback_data.date) {
		startBookingRoom(chatId);
	} else if (!callback_data.time) {
		slimbot.editMessageText(
			chatId,
			query.message.message_id,
			'Please select a time:',
			getTimeslotOptions(callback_data.date)
		);
	} else if (!callback_data.room) {
		slimbot.editMessageText(
			chatId,
			query.message.message_id,
			'Please select a room:',
			getRoomOptions(callback_data.date, callback_data.time)
		);
	} else {
		bookingRoom(query);
	}
}

slimbot.on('callback_query', query => {
	processBookingRoom(query);
});

// Call API
slimbot.startPolling();

function bookingRoom(query) {
	let callback_data = JSON.parse(query.data);
	console.log(query);
	slimbot
		.editMessageText(
			query.message.chat.id,
			query.message.message_id,
			bookingConfirmed(
				roomList[callback_data.room],
				callback_data.date,
				callback_data.time,
				`${query.from.first_name}`,
				query.from.username
			)
		)
		.then(message => {
			slimbot.sendMessage(query.message.chat.id, '/start');
		})
		.then(bookedRoom(query));
}

function bookedRoom(query) {
	let callback_data = JSON.parse(query.data);
	console.log(query);
	if (admin !== '') {
		slimbot.sendMessage(
			admin,
			`${query.from.first_name}(@${query.from.userName}) has just booked a room ${roomList[callback_data.room]}`
		);
	}
}
