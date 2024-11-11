import mongoose, { Schema, model } from "mongoose";

const ShipmentSchema = new Schema(
  {
    address_from:{},
    address_return:{},
    address_to:{},
    events:[],
    extras:{},
    parcel:{},
    carrier:{},
    created_shipment_id:String,
    pickup_id:String,
    rate:String,
    shipment_id:String,
    status:String,
    order: {
      type: mongoose.Types.ObjectId,
      ref: "Orders",
      required: true
    },
    carrier_tracking_number:String,
    delivery_arranged:String,
    delivery_date:Date,
    pickup_date:String,
    tracking_status:String,


  },
  {
    collection: "Shipments",
    timestamps: true
  }
);


export default model("Shipments", ShipmentSchema);