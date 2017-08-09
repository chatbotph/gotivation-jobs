

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
var oneprofile = {};

var perminuterule = new nodeschedule.RecurrenceRule();
perminuterule.second = 00;
// DEFAULT MOTIVATION 



var perminuterule = new nodeschedule.RecurrenceRule();
perminuterule.second = 00;
// DEFAULT MOTIVATION 
var m = nodeschedule.scheduleJob(perminuterule, function () {
    var predicate = {};
    predicate.isdefault = true;
    var utcMoment = moment.utc();
    var scheduletime = utcMoment.format('HH:mm');
    predicate.scheduletime = scheduletime;
    Scheduled.find(predicate)
        // todo: add sorting by current date
        .populate({ path: 'memberid', select: '_id memberid categories coach profiletype gender name currentsequence' })
        .exec()
        .then(data => {
            console.log(data.length + " schedule found");
            data.forEach(schedule => {
                var profile = schedule.memberid.profiletype;
                if (profile != '' || profile != null || profile != undefined)
                    LogicPerMember(schedule.memberid);
            })
        }).catch(err => {
            throw err;
        });
});


async function LogicPerMember(memberid) {
    try {
        paramObject = {};
        oneprofile = {};
        paramObject._id = memberid._id;
        paramObject.name = memberid.name;
        paramObject.coach = memberid.coach;
        paramObject.memberid = memberid.memberid;
        paramObject.profiletype = memberid.profiletype;
        paramObject.gender = memberid.gender;
        paramObject.currentsequence = memberid.currentsequence;
        await getCategorycontent(memberid.categories);
        await getUserProfile();
        await updateprofiledelivery();
        await getText();
        await getTagTerm();
        await getcontenttype();
        await bingsearch();
        await fbsendtext();
        await updatemessenger(paramObject.text);
        await fbsendattachment();
        await updatemessenger("attachment:" + paramObject.contentUrl);
        await updatesequence();
        await updatecoachmotivationsent();
        await createlog();
    } catch (error) {
        throw error;
    }
}

var getCategorycontent = (categories) => {
    var randomed = randomarray(categories);
    return Category.findById(randomed.category).
        then(data => {
            //name vid content
            paramObject.vidcontent = randomarray(data.vidcontent);
            paramObject.imagecontent = randomarray(data.content);
        }).catch(err => {
            throw err;
        });
};

var getUserProfile = () => {
    return UserProfile.find({ memberid: paramObject._id, delivery: { $ne: 0 } })
        .then(userprofile => {
            //need muna matapos ung if else
            if (userprofile.length > 0) {
                oneprofile = randomarray(userprofile);
            }
            else {
                UserProfile.remove({ memberid: paramObject._id });
                return Profile.find({ profile: paramObject.profiletype, delivery: { $ne: "0" } })
                    .then(data => {
                        var tosaveuserprofile = [];
                        data.map((item, index) => {
                            tosaveuserprofile.push({
                                memberid: member._id,
                                variable: item.variable,
                                tag: item.tag,
                                delivery: item.delivery
                            })
                        });
                        return UserProfile.insertMany(tosaveuserprofile)
                            .then(userprofile => {
                                oneprofile = randomarray(userprofile);
                            }).catch(err => { throw err });
                    })
            }

        }).catch(err => { throw err });
};

var updateprofiledelivery = () => {
    var deliveryval;
    if (paramObject.currentsequence >= 2 && paramObject.currentsequence <= 5)
        deliveryval = -1
    else
        deliveryval = 0

    return UserProfile.findOneAndUpdate({ memberid: oneprofile.memberid, variable: oneprofile.variable, tag: oneprofile.tag },
        { $inc: { delivery: deliveryval } })
        .then(userprofile => {
            paramObject.variable = oneprofile.variable;
            paramObject.tag = oneprofile.tag;
        }).catch(err => { throw err });
}


var getText = () => {
    return SendText.find({ tag: paramObject.tag, variable: paramObject.variable })
        .then(data => {
            data = randomarray(data);
            var textarray = [
                paramObject.name.first_name + ", " + data.text,
                data.text,
                data.text + " " + paramObject.name.first_name + "."
            ]
            paramObject.text = randomarray(textarray);
        }).catch(err => { throw err });
}

var getTagTerm = () => {
    return Tagterm.findOne({ tag: paramObject.tag })
        .then(data => {
            paramObject.tagterm = randomarray(data.terms)
        }).catch(err => { throw err });
}

var getcontenttype = () => {
    var seq = paramObject.currentsequence;
    if (seq == 1) {
        paramObject.contenttype = "images"
        paramObject.searchquery = paramObject.imagecontent + " motivation -god -government -religion -politics"
    }
    else if (seq >= 2 && seq <= 5) {
        paramObject.contenttype = "images"
        paramObject.searchquery = paramObject.tagterm + " motivational quote -god -government -religion -politics"
    }
    else {
        paramObject.contenttype = "videos"
        paramObject.searchquery = paramObject.vidcontent + " -god -government -religion -politics"
    }
}

var bingsearch = () => {
    var options = {
        method: 'GET',
        json: true,
        headers: { "Content-Type": "application/json", "Ocp-Apim-Subscription-Key": constant.BING_COGNITIVE_KEYv5 },
        url: `https://api.cognitive.microsoft.com/bing/${constant.BING_COGNITIVE_VERSION}/${paramObject.contenttype}/search?q=${paramObject.searchquery}&responseFilter=${paramObject.contenttype}&safeSearch=Moderate&count=60`
    };
    //console.log(options);
    return request(options).then(res => {
        searchresult = randomarray(res.data.value);
        console.log(searchresult);
        paramObject.contentUrl = searchresult.contentUrl
        paramObject.title = searchresult.name
        paramObject.thumbnail = searchresult.thumbnailUrl
    }).catch(err => { throw err });
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
    return request.post(requestUrl, requestData).then(data => {
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
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [
                        {
                            title: paramObject.title,
                            image_url: paramObject.thumbnail,
                            //subtitle: description,
                            default_action: {
                                type: "web_url",
                                url: paramObject.contentUrl,
                                webview_height_ratio: "tall",
                            }
                        }
                    ],
                }
            }
        },
        scrape: true

    }
    // console.log(options);
    return request.post(requestUrl, requestData).then(data => {
        console.log("attachment sent");
    }).catch(err => { throw err });
}




var updatecoachmotivationsent = () => {
    return User.findOneAndUpdate({ _id: paramObject.coach }, { $inc: { sentmotivation: 1 } })
        .then(data => {
            return data;
        }).catch(err => { throw err })
}


var updatesequence = () => {
    var currentsequence = paramObject.currentsequence == 7 ? 1 : paramObject.currentsequence + 1
    return Member.findOneAndUpdate({ memberid: paramObject._id }, { currentsequence: currentsequence })
        .then(data => {
            return data;
        }).catch(err => { throw err })
}


var updatemessenger = (message) => {
    message_body = {
        message: message,
        message_type: "outbound"
    }
    return
    Messenger.findOneAndUpdate({ member_id: ObjectId(paramObject._id) },
        { $push: { message_body: message_body } })
        .then(data => {
            return data;
        }).catch(err => { throw err });
}


var createlog = () => {
    console.log(paramObject);
    var logsparam = {
        memberid: paramObject._id,
        profiletype: paramObject.profiletype,
        url: paramObject.contentUrl,
        searchquery: paramObject.searchquery,
        contenttype: paramObject.contenttype,
        variable: paramObject.variable,
        tag: paramObject.tag,
        tagterm: paramObject.tagterm,
        pretext: paramObject.text
    }
    return LogMotivation.create(logsparam)
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