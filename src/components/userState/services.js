import getRethinkDB from "../../config/dbAccessControl.js";
import r from "rethinkdb";

import notificationServices from "../notifications/services.js";
import sendMessageRabbit from "../../rabbitmq/send.js";
import ioEmmit from "../../../app.js";

const service = {};

    service.addUser = async (user) => {
        const conn = await getRethinkDB();
        return new Promise((resolve, reject) => {
            let filer = {};
            if(user.member_id) {
                filer["member_id"] = user.member_id;
            } else {
                filer["crm_leads_id"] = user.crm_leads_id;
            }
            try {
            r.table("user_state")
            .filter(
               filer
            )
            .run(conn, (err, cursor) => {
                if(err) {resolve(user)}
                cursor.toArray((err, result) => {
                    if(err) {resolve(user)}
                    else {
                        if(result.length > 0){
                            service.updateUser(user)
                        } else {
                            r.table("user_state")
                            .insert(user)
                            .run(conn, (err, result) => {
                                if(err) {reject(err)};
                                service.getUser(user)
                                resolve(user);
                })
                        }
                    }
                })
                
            })

            } catch (error) {
                reject(error);
            }
            
        } )
    }
    service.updateUser = async (user) => {
        const conn = await getRethinkDB();

        return new Promise((resolve, reject) => {
            if (user.member_id !== null){
                r.table("user_state")
                .filter({ member_id: user.member_id })
                .update({
                    access_type: user.access_type
                })
                .run(conn, (err, result) =>{
                    if(err) {reject (err)};
                    service.getUser(user)
                    resolve(service.countStart());
                })
            } else{
                r.table("user_state")
                .filter({ crm_leads_id: user.crm_leads_id })
                .update({
                    access_type: user.access_type
                })
                .run(conn, (err, result) =>{
                    if(err){reject (err)};
                    service.getUser(user)
                    resolve(service.countStart())
                })
            }
        })
    }

    service.countPersons = async () => {
        const conn = await getRethinkDB();
        
        return new Promise((resolve, reject) => {
            r.table("user_state")
            .changes()
            .run(conn, (err, onChanged) => {
                resolve("ok");
                onChanged.each((err, result) => {
                    r.table("user_state")
                    .filter({ user_state : "Activo" })
                    .count()
                    .run(conn, (err, result) => {
                        ioEmmit({
                            key: "observerChanges",
                            data: result})
                        if(err) {reject (err)}
                        resolve({data: result})
                    })
                })
            })});
    }

    service.countStart = async () => {
        const conn = await getRethinkDB();

        return new Promise((resolve, reject) => {
            r.table("user_state")
            .filter({ access_type: "Entrada"})
            .count()
            .run(conn, (err, result) => {
                if(err) {resolve(err)}
                ioEmmit({
                    key: "countStart",
                    data: result
                })
                resolve({data: result})
            })
        })
    }
    
    service.getUser = async (user)=>{
        const conn = await getRethinkDB();
        return new Promise((resolve, reject) => {
            r.table("user_state")
            let filer = {};
            if(user.member_id) {
                filer["member_id"] = user.member_id;
            } else {
                filer["crm_leads_id"] = user.crm_leads_id;
            }
            try {
            r.table("user_state")
            .filter(
               filer
            )
            .run(conn, (err, result)=>{
                if(err){resolve(err)}
                ioEmmit({
                    key:"getUser",
                    data: user
                })
            })
            } 
            catch (error) {
                reject(error);
            }
        })
    }



export default service;
