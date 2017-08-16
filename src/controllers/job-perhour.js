

const _ = require('underscore');
const request = require('axios');
const mongoose = require('mongoose');

const Category = require('../models/category');
const Class = require('../models/class');
const Member = require('../models/member');
const Messenger = require('../models/messenger');
const Notification = require('../models/notification');
const Profile = require('../models/profile');
const LogMotivation = require('../models/motivationlog');
const Quote = require('../models/quote');
const Scheduled = require('../models/scheduled');
const Tagterm = require('../models/tagterm');
const SendText = require('../models/text');
const User = require('../models/user');
const UserProfile = require('../models/userprofile');


const constant = require('../constant');
const async = require('async');
const Immutable = require('immutable');
const ObjectId = mongoose.Types.ObjectId;
const nodeschedule = require('node-schedule');
const moment = require('moment');
const access_token = constant.FACEBOOK_TOKEN
const requestUrl = `https://graph.facebook.com/v2.9/me/messages?access_token=${access_token}`;

var paramObject = {};



var perhourrule = new nodeschedule.RecurrenceRule();
perhourrule.second = 00;
// DEFAULT MOTIVATION 
var m = nodeschedule.scheduleJob(perhourrule, function () {
    var predicate = {};
    var now = new Date;

    predicate.scheduledate = moment.utc(now).format("MM-DD-YYYY");
    predicate.scheduletime = moment.utc(now).format('HH:00');
    predicate.isdefault = false;
    predicate.status = "Active";
    Scheduled.find(predicate)
        .then(data => {
            async.forEachOf(data,(schedelement => {
                var tofind = {};
                tofind.onboarded = true;
                var proceed = false;
                if (schedelement.classid) {
                    tofind.classes = schedelement.classid;
                    proceed = true;
                }
                if (schedelement.memberid) {
                    tofind._id = schedelement.memberid;
                    proceed = true;
                }
                if (proceed) {
                    Member.find(tofind,
                        ('memberid name'))
                        .then(data => {
                            async.forEachOf(data, (memberelement => {
                                paramObject = {};
                                paramObject.text = schedelement.message
                                paramObject._id = memberelement._id
                                paramObject.memberid = memberelement.memberid
                                paramObject.url = schedelement.url
                                paramObject.contenttype = schedelement.contenttype
                                paramObject.coach = schedelement.coach
                                SendMotivation();
                            }));
                        }).catch(err => { throw err });
                }
            }));
        }).catch(err => {
            throw err;
        });
});


async function SendMotivation() {
    try {

        await fbsendtext();
        await fbsendattachment();
        await updatemessenger(paramObject.text);
        await updatemessenger("attachment:" + paramObject.url);
        await updatecoachmotivationsent();
    } catch (error) {
        throw error;
    }
}





var fbsendtext = () => {
    var requestData = {
        recipient: {
            id: paramObject.memberid
        },
        message: {
            text: paramObject.text
        }
    }

    // console.log(options);
    return request.post(requestUrl, requestData)
    .then(data => {
        console.log("text sent");
    }).catch(err => { throw err });

}

var fbsendattachment = () => {
    var requestData = {
        recipient: {
            id: paramObject.memberid
        },
        message: {
            attachment: {
                type: paramObject.contenttype,
                payload: {
                    url: paramObject.url,
                    is_reusable: true
                }
            }
        },
        scrape: true

    }
    // console.log(options);
    return request.post(requestUrl, requestData)
    .then(data => {
        console.log("attachment sent");
    }).catch(err => { throw err });
}




var updatecoachmotivationsent = () => {
    return User.findOneAndUpdate({ _id: paramObject.coach }, { $inc: { sentmotivation: 1 } })
        .then(data => {
            return data;
        }).catch(err => { throw err })
}



var updatemessenger = (message) => {
    message_body = {
        message: message,
        message_type: "outbound"
    }
    return Messenger.findOneAndUpdate({ member_id: ObjectId(paramObject._id) },
        { $push: { message_body: message_body } })
        .then(data => {
            return data;
        }).catch(err => { throw err });
}






function randomarray(randomarray) {
    try {
        var randomresult = randomarray[Math.floor(Math.random() * randomarray.length)]
        return randomresult;
    } catch (error) {
        console.log(randomarray);
    }

}