const Slimbot = require('slimbot');
const express = require('express');
const request = require('request');
const debug = require('debug')('app:debug');
const app = express();
// Configure express server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => debug(`Listening on port ${PORT}`));

const slimbot = new Slimbot(process.env['TELEGRAM_BOT_TOKEN'] || '652564326:AAHDCLRLVRLbqQvFlSInKeSuKGE6O1qSHyw');

var admin = '';

let bookerList = {};

const roomList = [
	'Null',
	'Leadership (30pax)',
	'Respect (30pax)',
	'Teamwork (30pax)',
	'Professionalism (20pax)',
	'Openness (40pax)',
	'#05-05 (10pax)',
	'#08-05 (10pax)',
	'#09-05 (20pax)',
	'#10-05 (20pax)',
	'#18-05 (20pax)'
];

function getTodayOrTomorrowOptions() {
	return {
		parse_mode: 'Markdown',
		reply_markup: JSON.stringify({
			inline_keyboard: [
				[
					{ text: 'Today', callback_data: JSON.stringify({ date: 'Today' }) },
					{ text: 'Tomorrow', callback_data: JSON.stringify({ date: 'Tomorrow' }) },
					{ text: 'Others', callback_data: JSON.stringify({ date: 'Others' }) },
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
					{ text: '09:00 AM', callback_data: JSON.stringify({ date: date, time: '09:00 AM' }) },
					{ text: '10:00 AM', callback_data: JSON.stringify({ date: date, time: '10:00 AM' }) },
					{ text: '11:00 AM', callback_data: JSON.stringify({ date: date, time: '11:00 AM' }) },
				],
				[
					{ text: '12:00 PM', callback_data: JSON.stringify({ date: date, time: '12:00 PM' }) },
					{ text: '13:00 PM', callback_data: JSON.stringify({ date: date, time: '13:00 PM' }) },
					{ text: '14:00 PM', callback_data: JSON.stringify({ date: date, time: '14:00 PM' }) },
				],
				[
					{ text: '15:00 PM', callback_data: JSON.stringify({ date: date, time: '15:00 PM' }) },
					{ text: '16:00 PM', callback_data: JSON.stringify({ date: date, time: '16:00 PM' }) },
					{ text: '17:00 PM', callback_data: JSON.stringify({ date: date, time: '17:00 PM' }) },
				],
			],
		}),
	};
}

function getDurationOptions(date, time) {
	return {
		parse_mode: 'Markdown',
		reply_markup: JSON.stringify({
			inline_keyboard: [
				[
					{
						text: '1 hr',
						callback_data: JSON.stringify({ date: date, time: time, dura: '1 hr' }),
					},
				],
				[
					{
						text: '2 hr',
						callback_data: JSON.stringify({ date: date, time: time, dura: '2 hr' }),
					},
				],
				[
					{
						text: '3 hr',
						callback_data: JSON.stringify({ date: date, time: time, dura: '3 hr' }),
					},
				],
			],
		}),
	};
}

function getRoomOptions(date, time, dura) {
	return {
		parse_mode: 'Markdown',
		reply_markup: JSON.stringify({
			inline_keyboard: [
				[
					{
						text: roomList[1],
						callback_data: JSON.stringify({ date: date, time: time, dura: dura, room: 1 }),
					},
					{
						text: roomList[2],
						callback_data: JSON.stringify({ date: date, time: time, dura: dura, room: 2 }),
					},
				],
				[
					{
						text: roomList[3],
						callback_data: JSON.stringify({ date: date, time: time, dura: dura, room: 3 }),
					},
					{
						text: roomList[4],
						callback_data: JSON.stringify({ date: date, time: time, dura: dura, room: 4 }),
					},
				],
				[
					{
						text: roomList[5],
						callback_data: JSON.stringify({ date: date, time: time, dura: dura, room: 5 }),
					},
					{
						text: roomList[6],
						callback_data: JSON.stringify({ date: date, time: time, dura: dura, room: 6 }),
					},
				],
				[
					{
						text: roomList[7],
						callback_data: JSON.stringify({ date: date, time: time, dura: dura, room: 7 }),
					},
					{
						text: roomList[8],
						callback_data: JSON.stringify({ date: date, time: time, dura: dura, room: 8 }),
					},
				],
				[
					{
						text: roomList[9],
						callback_data: JSON.stringify({ date: date, time: time, dura: dura, room: 9 }),
					},
					{
						text: roomList[10],
						callback_data: JSON.stringify({ date: date, time: time, dura: dura, room: 10 }),
					},
				],
			],
		}),
	};
}

function setDescription(date, time, dura, room) {

}

function bookingConfirmed(room, date, time, dura, userName, text) {
	return `Your booking request has been submitted! \n----------------------------\n \
	Date: ${date}\n \
	Time: ${time}\n \
	Duration: ${dura}\n \
	Room: ${room}\n \
	Department: ${text}\n \
	Booked by: @${userName}\n\
	----------------------------\nYou will be notified by an administrator on the outcome of your request! 😊 \
	`;
}

function bookingConfirmedAdmin(room, date, time, dura, userName) {
	return `You have received a booking request! \n----------------------------\n \
	Date: ${date}\n \
	Time: ${time}\n \
	Duration: ${dura}\n \
	Room: ${room}\n \
	Booked by: @${userName}\n\
	----------------------------\n\
	`;
}

// Register listener
slimbot.on('message', message => {
	switch (message.text.trim()) {
		case '/register':
			admin = message.chat.id;
			slimbot.sendMessage(admin, 'You have registered as Admin');
			break;
		case '/start':
			slimbot.sendMessage(message.chat.id, 'To submit a meeting room request, type /book');
			break;
		case '/book':
			startBookingRoom(message.chat.id);
			break;
		default:
			{
				if (bookerList[message.chat.id] && bookerList[message.chat.id].room) {
					confirmBooking(bookerList[message.chat.id], message.text);
				}
			}
	}
});

function startBookingRoom(chatId) {
	slimbot.sendMessage(chatId, 'Please select date:', getTodayOrTomorrowOptions());
}

function processBookingRoom(query) {
	var chatId = query.message.chat.id;
	let callback_data = JSON.parse(query.data);
	console.log(callback_data)
	if (!callback_data.date) {
		startBookingRoom(chatId);
	} else if (!callback_data.time) {
		slimbot.editMessageText(
			chatId,
			query.message.message_id,
			'Please select time:',
			getTimeslotOptions(callback_data.date)
		);
	} else if (!callback_data.dura) {
		slimbot.editMessageText(
			chatId,
			query.message.message_id,
			'Please select duration:',
			getDurationOptions(callback_data.date, callback_data.time)
		);
	} else if (!callback_data.room) {
		slimbot.editMessageText(
			chatId,
			query.message.message_id,
			'Please select room:',
			getRoomOptions(callback_data.date, callback_data.time, callback_data.dura)
		);
	} else {
		//bookingRoom(query);
		slimbot.editMessageText(
			chatId,
			query.message.message_id,
			'Please enter the department:'
		).then((message) => {
			let botId = message.result.chat.id;
			bookerList[query.from.id] = {
				id: query.from.id,
				chatType: query.message.chat.type,
				msgid: query.message.message_id,
				name: query.from.username,
				date: callback_data.date,
				room: callback_data.room,
				time: callback_data.time,
				dura: callback_data.dura
			};
		});
	}
}

slimbot.on('callback_query', query => {
	processBookingRoom(query);
});

// Call API
slimbot.startPolling();

// function bookingRoom(query) {
// 	let callback_data = JSON.parse(query.data);
// 	console.log(query);
// 	slimbot
// 		.editMessageText(
// 			query.message.chat.id,
// 			query.message.message_id,
// 			bookingConfirmed(
// 				roomList[callback_data.room],
// 				callback_data.date,
// 				callback_data.time,
// 				callback_data.dura,
// 				`${query.from.first_name}`,
// 				query.from.username
// 			)
// 		)
// 		.then(message => {
// 			slimbot.sendMessage(query.message.chat.id, 'To submit a meeting room request, type /book');
// 		})
// 		.then(bookedRoom(query));
// }

function confirmBooking(booking, text) {
	slimbot
		.editMessageText(
			booking.id,
			booking.msgid,
			bookingConfirmed(
				roomList[booking.room],
				booking.date,
				booking.time,
				booking.dura,
				booking.name,
				text
			)
		)
		.then(message => {
			slimbot.sendMessage(booking.id, 'To submit a meeting room request, type /book');
		})
		.then(bookedRoom(booking));
}

function bookedRoom(booking) {
	if (admin !== '') {
		slimbot.sendMessage(
			admin,
			bookingConfirmedAdmin(booking)
			// `@${booking.name} has just booked a room ${roomList[booking.room]}`
		);
	}
}
