const pool = require("../../config/database");
const util = require("util");
// node native promisify
const query = util.promisify(pool.query).bind(pool);
const { success, failure, created } = require("../../utils/response");
const vehicleJSON = require("../../models/vehicle");
const unirest = require("unirest");
require("dotenv").config();
const { validate } = require("../../utils/validateFun");
const { isBefore24Hours } = require("../../utils/helperFunctions");

module.exports = {
  /**
   * Fetch all vehicle Profile
   * @param {Request} req
   * @param {Response} res
   */
  vehicleProfile: async (req, res) => {
    try {
      let results = await query(
        `select
        vp.*,
        rp.*,
        vm.*,
        vb.*,
        rwt.*,
        vt.*,
        clm.ClientMasterId,
        clm.ClientName,
        clm.ClientNumber,
        clm.ClientEmail,
        clm.ClientAddress,
        dm.IoTDeviceId
      from
        VehicleProfile as vp
        join RiderProfile as rp on rp.RiderProfileId = vp.RiderProfileId
        join City_Master as cm on cm.City_Id = vp.City_Id
        join Vehicle_Model as vm on vm.Model_Id = vp.Model_Id
        join Vehicle_Brand as vb on vb.Brand_Id = vm.Brand_Id
        left join Rear_Wheel_Type as rwt on rwt.id = vp.Rear_Whee_ld
        left join Vehicle_Type as vt on vt.id = vp.Vehicle_Type
        join Client_Master as clm on clm.ClientMasterId = rp.ClientMasterId
        left join DeviceMaster as dm on dm.DeviceMasterId = vp.DeviceMasterId
        Where vp.Active=1`
      );
      if (!results) {
        return success(res, "No result found", {});
      }
      let data = [];
      for (let i of results) {
        let obj = vehicleJSON.fromJSON(i);
        data.push(obj);
      }

      return success(res, "fetching the data of all Vehicle", data);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while getting Vehicle", err.message);
    }
  },
  /**
   * Fetch vehicle Profile by Id
   * @param {Request} req
   * @param {Response} res
   */
  getVehicleById: async (req, res) => {
    try {
      const id = req.params.id;

      if (!validate(id, "Number")) {
        return failure(res, "Invalid vehicle id");
      }

      let results = await query(
        `select * from VehicleProfile as vp
        left join RiderProfile as rp on rp.RiderProfileId=vp.RiderProfileId
        left join City_Master as cm on cm.City_Id=vp.City_Id
        left join Vehicle_Model as vm on vm.Model_Id=vp.Model_Id
        left join Vehicle_Brand as vb on vb.Brand_Id=vm.Brand_Id
        left join Rear_Wheel_Type as rwt on rwt.id=vp.Rear_Whee_ld
        left join Vehicle_Type as vt on vt.id=vp.Vehicle_Type
        left join Type_Master tm on tm.TypeMasterId=vp.TransportType
        where vp.VehicleProfileId=${id} and vp.Active=1`
      );

      if (!results || results.length === 0) {
        return success(res, "No results Found", {});
      }
      let data = [];
      for (let i of results) {
        let obj = vehicleJSON.fromJSON(i);
        data.push(obj);
      }

      return success(res, "fetching the data", data);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * update is vehicle modified or not
   * @param {Request} req
   * @param {Response} res
   */
  updateismodified: async (req, res) => {
    try {
      const id = req.params.id;

      if (!validate(id, "Number")) {
        return failure(res, "Invalid vehicle id");
      }

      let results = await query(`update VehicleProfile SET IsModified=${req.body.isModified} where VehicleProfileId=${id} `);
      if (!results) {
        return success(res, "No results Found", {});
      }
      return success(res, "fetching the data", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Fetch all vehicle current stage
   * @param {Request} req
   * @param {Response} res
   */
  updateVehileStageById: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const value = parseInt(req.params.value);

      if (!validate(id, "Number")) {
        return failure(res, "Invalid vehicle id");
      }

      if (!validate(value, "Number")) {
        return failure(res, "Invalid stage id");
      }

      let results = await query(`update VehicleProfile SET Vehicle_Stage_Id=${value} where VehicleProfileId=${id} `);

      if (!results) {
        return success(res, "update not done", {});
      }

      if (results.affectedRows > 0) {
        let ans = await query(`insert into Vehicle_Stage_Details (StageMasterId,Vehicle_Id,Current_Stage_Status) values (?,?,?)`, [value, id, 1]);
        return success(res, "Vehicle stage updated successfully", results);
      }
    } catch (err) {
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Add Vehicle Profile
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  addVehicleProfile: async (req, res) => {
    try {
      let body = req.body;
      let RiderProfileId = parseInt(body.RiderProfileId) || 1;
      let Mfgyr = body.ManufacturingYear;
      let City_Id = parseInt(body.City_Id);
      let Reg_No = body.Reg_No;
      let Rear_Whee_ld = body.Rear_Whee_ld;
      let Model_Id = parseInt(body.Model_Id);
      let Inspection_Date = body.Inspection_Date;
      if (Reg_No === "" || Reg_No === undefined || Reg_No === null || Mfgyr === "" || Mfgyr === undefined || Mfgyr === null || Model_Id === "" || Model_Id === undefined || Model_Id === null || City_Id === "" || City_Id === undefined || City_Id === null || Rear_Whee_ld === "" || Rear_Whee_ld === undefined || Rear_Whee_ld === null) {
        return success(res, "Reg No,Mfgyr,Model Id ,Rear Wheel Id and City Id are Mandatory", []);
      }
      let user = await query(`SELECT * FROM VehicleProfile WHERE Registration_No=?`, [Reg_No]);
      if (user.length > 0) {
        return success(res, "Vehicle Profile already exists", []);
      }
      let results = await query(
        `INSERT INTO VehicleProfile (RiderProfileId,ManufacturingYear,City_Id,Registration_No,Model_Id,Rear_Whee_ld,InspectionDate)
      VALUES (?,?,?,?,?,?,?)`,
        [RiderProfileId, Mfgyr, City_Id, Reg_No, Model_Id, parseInt(Rear_Whee_ld), Inspection_Date]
      );
      if (!results || results.affectedRows === 0) {
        return success(res, "Problem in performing performing the operation", {});
      }
      return created(res, "Inserted", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while creating the vehicle profile", err.message);
    }
  },
  /**
   * Get latest location by Device ID
   * @param {String} did
   * @param {Request} req
   * @param {Response} res
   * @returns the object that contains the latest location with non-zero lan and lon
   */
  getLocationByDeviceId: async function (req, res) {
    try {
      const data = await query(
        `
      SELECT *
      FROM \`Vehicle_IOT_Data\` as vid
      WHERE Did=? AND Lat<>"[0]" AND Lon <>"[0]"
      ORDER BY Date DESC LIMIT 1
      `,
        [req.params.Did]
      );
      if (data.length != 0) return success(res, "Data fetched Successfully", data);
      return failure(res, "Invalid Device ID or no data found", null);
    } catch (error) {
      return failure(res, "Error while fetching the data", error.message);
    }
  },
  /**
   * Get Vehicle By Device Id
   * @param {Number} mobileno.
   *
   * @returns
   */
  getVehicleByDeviceId: async function (req, res) {
    try {
      let device = req.params.deviceId;

      let results = await query(
        `select  * from  VehicleProfile vp 
      join DeviceMaster as dm on dm.DeviceMasterId = vp.DeviceMasterId
      join City_Master as cm on cm.City_Id = vp.City_Id
      join State_Master as sm on sm.State_Id = cm.State_Id
      join Country_Master as country on country.Country_Id = sm.Country_Id
      join Rear_Wheel_Type as rw on rw.id=vp.Rear_Whee_ld
    where  dm.IoTDeviceId = ? and vp.Active=1`,
        [device]
      );

      for (let i of results) {
        i["IsRepainted"] = i["IsRepainted"][0];
        i["IsModified"] = i["IsModified"][0];
        i["IsBlacklisted"] = i["IsBlacklisted"][0];
        i["IsActiveChallan"] = i["IsActiveChallan"][0];
        i["SellerIsOwner"] = i["SellerIsOwner"][0];
        i["IsActive"] = i["IsActive"][0];
      }
      return success(res, "data fetched successfully", results);
    } catch (error) {
      return failure(res, "Error while fetching the data", error.message);
    }
  },
  /**
   * Get SOC and FG By DeviceID
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getSOCandFGByDeviceId: async function (req, res) {
    try {
      if (Object.keys(req.params).length === 0) {
        return failure(res, "Device Id is missing", {});
      }
      const data = await query(`SELECT * FROM \`Vehicle_IOT_Data\` as vid WHERE Did=? AND vid.FG <> 0 ORDER BY Date DESC LIMIT 5`, [req.params.Did]);
      let totalFuel = 0;
      let totalSoC = 0;
      if (!data || data.length == 0) {
        return success(res, "Data Not found for the device ID", {});
      }
      data.forEach((d) => {
        totalFuel += parseInt(d["FG"]);
        totalSoC += parseInt(d["SOC"]);
      });
      data[0]["AvgFG"] = parseInt(totalFuel / 5);
      data[0]["AvgSoC"] = parseInt(totalSoC / 5);
      return success(res, "Data found for the device ID", data[0]);
    } catch (error) {
      return failure(res, "Error in getting the SOC and Fuel gauge", error.message);
    }
  },
  getFirstPacketByDeviceId: async function (req, res) {
    try {
      if (Object.keys(req.params).length === 0) {
        return failure(res, "Device Id is missing", {});
      }
      const data = await query(
        `select
        *
      from
        Vehicle_IOT_Data vid
      where
        vid.id > (
          SELECT
            vid.id
          FROM
            Vehicle_IOT_Data vid
          WHERE
            vid.Did =?
            AND vid.Ign ="0"
          ORDER BY
            vid.id DESC
          LIMIT
            1
        )
        AND vid.Did =?
        AND vid.Lat <> "[0]"
        AND vid.Lon <> "[0]"
      order by
        vid.id asc
      LIMIT
        1`,
        [req.params.deviceId, req.params.deviceId]
      );
      if (!data || data.length == 0) {
        return success(res, "First packet not found for the device ID", {});
      } else if (isBefore24Hours(data[0].Date)) {
        return success(res, "Last Packet recevied of ignition 1 (after Ignition 0) was Before 24hrs", []);
      } else {
        return success(res, "First packet  data found for the device ID", data);
      }
    } catch (error) {
      return failure(res, "Error in getting the first packet by device id", error.message);
    }
  },
  getVehicleStage: async (req, res) => {
    try {
      let regNo = req.params.regNo;

      if (Object.keys(req.params).length === 0) {
        return failure(res, "Registration No is missing", {});
      }

      let results = await query(
        `select
        sm.Stage_Master_Id,
        sm.Stage_Name as Details,
        sm.Stage_Category as Stage,
        sm.Stage_Parent_Id as Stage_Number,
        vp.Registration_No,
        vsd.Created_On,
        vsd.Updated_On,
        u.UserName as assigned_user,
        u.MobileNumber
       from
         Vehicle_Stage_Details vsd
         join Stage_Master sm on sm.Stage_Master_Id = vsd.StageMasterId
         join VehicleProfile vp on vp.VehicleProfileId = vsd.Vehicle_Id
         join \`User\` u on u.UserId = vsd.Assigned_User_Id
         where vp.Registration_No=? and vp.Active=1`,
        [regNo]
      );
      let arr = [];
      for (let i of results) {
        let obj = {};
        i["Stage_Number"] = parseInt(i["Stage_Number"]);
        obj["Stage_number"] = i["Stage_Number"];
        if (i["Stage_Number"] === 10 || i["Stage_Number"] === 11 || i["Stage_Number"] === 14 || i["Stage_Number"] === 15 || i["Stage_Number"] === 16) {
          obj["Stage_Name"] = "LEAD";
        } else if (i["Stage_Number"] === 1 || i["Stage_Number"] === 2 || i["Stage_Number"] === 3 || i["Stage_Number"] === 28 || i["Stage_Number"] === 29) {
          obj["Stage_Name"] = "INSPECTION";
        } else if (i["Stage_Number"] === 4 || i["Stage_Number"] === 5 || i["Stage_Number"] === 6 || i["Stage_Number"] === 32 || i["Stage_Number"] === 33 || i["Stage_Number"] === 34 || i["Stage_Number"] === 35 || i["Stage_Number"] === 36) {
          obj["Stage_Name"] = "HRC";
        } else if (i["Stage_Number"] === 7 || i["Stage_Number"] === 8) {
          obj["Stage_Name"] = "CONVERISON PROCESS";
        } else if (i["Stage_Number"] === 9) {
          obj["Stage_Name"] = "VEHICLE OUT";
        }
        obj["Details"] = i["Details"];
        obj["Created_on"] = i["Created_on"];
        obj["Updated_on"] = i["Updated_on"];
        obj["Assigned_user"] = i["assigned_user"];
        obj["Assigned_mobile_number"] = i["MobileNumber"];
        arr.push(obj);
      }

      if (results.length == 0) {
        return success(res, "Data not found", []);
      }
      return success(res, "Data found", arr);
    } catch (error) {
      return failure(res, "Error while fetching the data", error.message);
    }
  },
  getAllRegNo: async (req, res) => {
    try {
      let results = await query(`select 
      vp.VehicleProfileId,
      vp.Registration_No
      from VehicleProfile vp Where vp.Active=1`);

      if (results.length == 0) {
        return failure(res, "Data not found", []);
      }

      return success(res, "Data found", results);
    } catch (error) {
      return failure(res, "Error while fetching the data", error.message);
    }
  },
  /**
   * get all the rear wheel type
   * @param {*} req
   * @param {*} res
   * @returns rear wheel type  and id
   */
  getRearWheelType: async (req, res) => {
    try {
      let results = await query(`select 
      rw.id,
      rw.Wheel_type
      from Rear_Wheel_Type rw`);

      if (results.length == 0) {
        return success(res, "Data not found", []);
      }

      return success(res, "Data found", results);
    } catch (error) {
      return failure(res, "Error while fetching the data", error.message);
    }
  },
  /**
   * Get Vehicle Models
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getVehicleModels: async (req, res) => {
    try {
      let results = await query(` select 
    vm.Model_Id,
    vm.Model_Name,
    vm.Variant,
    vm.MfgYr,
    vb.Brand_Id,
    vb.Brand_Name
      from Vehicle_Model vm 
         join Vehicle_Brand vb on vb.Brand_Id = vm.Brand_Id
           where vm.IsActive=1 and vb.IsActive=1
       order by vm.Model_Id `);
      if (results.length > 0) {
        return success(res, "Vehicle Models Data Fetched", results);
      } else {
        return failure(res, "No data found", []);
      }
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Get Vehicle Stage Info by Registration Number
   * @param {Request} req
   * @param {Response} res
   * @param {String} regno
   * @returns
   */
  getVehicleStageInfo: async (req, res) => {
    try {
      const reg = req.params.regno;

      if (!reg || reg === "") {
        return failure(res, "Data missing or invalid data", []);
      }

      let results = await query(
        `select
        distinct(q.TypeMasterId),
        t.TypeName,
        t.CategoryType,
        v.Registration_No,
        jc.JobCard,
        vit.ActualTime_VI AS PICKEDUP,
        vit.ActualTime_VO AS DROPED,
        vi.kms_driven as KM_AT_VehicleIN,
        ia.Id as Inventory_Allocation_Id
      from
        VehicleProfile v
        LEFT join QuestionResponseInput q on q.VehicleProfileId = v.VehicleProfileId
        LEFT join Type_Master t on t.TypeMasterId = q.TypeMasterId
        LEFT join hrc_job_card jc on jc.VehicleProfileId = v.VehicleProfileId
        LEFT join Vehicle_In_Transit vit on vit.VehilceId = v.VehicleProfileId
        LEFT join hrc_vehicle_in vi on vi.Vehicle_Profile_Id = v.VehicleProfileId
        LEFT join hrc_inventory_allocation ia on ia.JobCardId = jc.JobCardId
      where
        v.Registration_No = ? and v.Active=1`,
        [reg]
      );
      if (results.length > 0) {
        let optimizedData = [];
        if (results[0].TypeMasterId !== null) {
          optimizedData = results.map((item) => {
            return item.TypeMasterId;
          });
        }
        const finalData = [
          {
            inspection: optimizedData,
            Registration_No: results[0].Registration_No,
            JobCard: results[0].JobCard,
            Vehicle_Picked: results[0].PICKEDUP,
            Vehicle_Droped: results[0].DROPED,
            KM_VehicleIN: results[0].KM_AT_VehicleIN,
            Inventory_Allocation_Id: results[0].Inventory_Allocation_Id,
          },
        ];

        return success(res, "Data fetched successfully", finalData);
      } else {
        return failure(res, "Data not available", []);
      }
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Update Vehicle Profile
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  updateVehicleProfile: async function (req, res) {
    try {
      const vehicleProfile = await query(`SELECT * FROM VehicleProfile as vp WHERE VehicleProfileId=? and vp.Active=1 `, [req.params.id]);
      if (vehicleProfile.length === 0) return success(res, `Vehicle profile not found for Vehicle Profile Id ${req.params.id}`, []);
      const {
        riderProfileId: RiderProfileId,
        deviceMasterId: DeviceMasterId,
        cityId: City_Id,
        rtoLocation: RTOLocation,
        manufacturingYear: ManufacturingYear,
        ownerCount: OwnerCount,
        vehicleColor: VehicleColor,
        loanHistory: LoanHistory,
        isModified: isModified,
        IsActiveChallan: IsActiveChallan,
        IsRepainted: IsRepainted,
        insurance: Insurance,
        variant: Variant,
        kmsDriven: KmsDriven,
        isBlacklisted: IsBlacklisted,
        ownerProfession: OwnerProfession,
        sellerIsOwner: SellerIsOwner,
        vehicleStageId: Vehicle_Stage_Id,
        registrationNo: Registration_No,
        registrationType: Registration_Type,
        rcAddress: RC_Address,
        chasisNo: Chasis_No,
        engineNo: Engine_No,
        modelId: Model_Id,
        rearWheelId: Rear_Whee_ld,
        vehicleType: Vehicle_Type,
        inspectionDate: InspectionDate,
        remarks: Remarks,
        loanBankName: LoanBankName,
        outStandingAmount: OutStandingAmount,
        insuranceCompany: InsuranceCompany,
        policyNumber: PolicyNumber,
        policyValidity: PolicyValidity,
        transportType: TransportType,
        avgDailyKm: AvgDailyKm,
        images: Images,
        hpLease: hpLease,
        registrationDate: registrationDate,
        repaintColor: RepaintedColor,
      } = req.body;
      const updateKey = [];
      const updateValue = [];
      if (RiderProfileId) {
        updateKey.push("RiderProfileId=?");
        updateValue.push(RiderProfileId);
      }
      if (DeviceMasterId) {
        updateKey.push("DeviceMasterId=?");
        updateValue.push(DeviceMasterId);
      }
      if (City_Id) {
        updateKey.push("City_Id=?");
        updateValue.push(City_Id);
      }
      if (RTOLocation) {
        updateKey.push("RTOLocation=?");
        updateValue.push(RTOLocation);
      }
      if (ManufacturingYear) {
        updateKey.push("ManufacturingYear=?");
        updateValue.push(ManufacturingYear);
      }
      if (isModified) {
        updateKey.push("isModified=?");
        updateValue.push(isModified);
      }
      if (IsActiveChallan) {
        updateKey.push("IsActiveChallan=?");
        updateValue.push(IsActiveChallan);
      }
      if (IsRepainted) {
        updateKey.push("IsRepainted=?");
        updateValue.push(IsRepainted);
      }
      if (OwnerCount) {
        updateKey.push("OwnerCount=?");
        updateValue.push(OwnerCount);
      }
      if (VehicleColor) {
        updateKey.push("VehicleColor=?");
        updateValue.push(VehicleColor);
      }
      if (LoanHistory) {
        updateKey.push("LoanHistory=?");
        updateValue.push(LoanHistory);
      }
      if (registrationDate) {
        updateKey.push("registrationDate=?");
        updateValue.push(registrationDate);
      }
      if (Insurance) {
        updateKey.push("Insurance=?");
        updateValue.push(Insurance);
      }
      if (Variant) {
        updateKey.push("Variant=?");
        updateValue.push(Variant);
      }
      if (KmsDriven) {
        updateKey.push("KmsDriven=?");
        updateValue.push(KmsDriven);
      }
      if (IsBlacklisted) {
        updateKey.push("IsBlacklisted=?");
        updateValue.push(IsBlacklisted);
      }
      if (OwnerProfession) {
        updateKey.push("OwnerProfession=?");
        updateValue.push(OwnerProfession);
      }
      if (SellerIsOwner) {
        updateKey.push("SellerIsOwner=?");
        updateValue.push(SellerIsOwner);
      }
      if (Vehicle_Stage_Id) {
        updateKey.push("Vehicle_Stage_Id=?");
        updateValue.push(Vehicle_Stage_Id);
      }
      if (Registration_No) {
        updateKey.push("Registration_No=?");
        updateValue.push(Registration_No);
      }
      if (Registration_Type) {
        updateKey.push("Registration_Type=?");
        updateValue.push(Registration_Type);
      }
      if (RC_Address) {
        updateKey.push("RC_Address=?");
        updateValue.push(RC_Address);
      }
      if (Chasis_No) {
        updateKey.push("Chasis_No=?");
        updateValue.push(Chasis_No);
      }
      if (Engine_No) {
        updateKey.push("Engine_No=?");
        updateValue.push(Engine_No);
      }
      if (Model_Id) {
        updateKey.push("Model_Id=?");
        updateValue.push(Model_Id);
      }
      if (Rear_Whee_ld) {
        updateKey.push("Rear_Whee_ld=?");
        updateValue.push(Rear_Whee_ld);
      }
      if (Vehicle_Type) {
        updateKey.push("Vehicle_Type=?");
        updateValue.push(Vehicle_Type);
      }
      if (InspectionDate) {
        updateKey.push("InspectionDate=?");
        updateValue.push(InspectionDate);
      }
      if (Remarks) {
        updateKey.push("Remarks=?");
        updateValue.push(Remarks);
      }
      if (hpLease) {
        updateKey.push("HP_Lease=?");
        updateValue.push(hpLease);
      }

      if (LoanBankName) {
        updateKey.push("LoanBankName=?");
        updateValue.push(LoanBankName);
      }

      if (OutStandingAmount) {
        updateKey.push("OutstandingAmount=?");
        updateValue.push(OutStandingAmount);
      }

      if (InsuranceCompany) {
        updateKey.push("InsuranceCompany=?");
        updateValue.push(InsuranceCompany);
      }

      if (PolicyNumber) {
        updateKey.push("PolicyNumber=?");
        updateValue.push(PolicyNumber);
      }

      if (PolicyValidity) {
        updateKey.push("PolicyValidTill=?");
        updateValue.push(PolicyValidity);
      }

      if (TransportType) {
        updateKey.push("TransportType=?");
        updateValue.push(TransportType);
      }

      if (AvgDailyKm) {
        updateKey.push("AvgDailyKm=?");
        updateValue.push(AvgDailyKm);
      }
      if (Vehicle_Type) {
        updateKey.push("Vehicle_Type=?");
        updateValue.push(Vehicle_Type);
      }
      if (Images) {
        updateKey.push("Images=?");
        updateValue.push(JSON.stringify(Images));
      }
      if (RepaintedColor) {
        updateKey.push("RepaintedColor=?");
        updateValue.push(RepaintedColor);
      }
      updateValue.push(req.params.id);
      const updatedData = await query(`UPDATE \`VehicleProfile\` SET ${updateKey.join(",")} Where VehicleProfileId=?`, updateValue);
      if (updatedData.affectedRows > 0) {
        if (InspectionDate) {
          const customer = await query(
            `SELECT l.MobileNumber FROM \`VehicleProfile\` as vp
          JOIN \`Lead\` as l on l.Vehicle_Profile = vp.VehicleProfileId WHERE vp.VehicleProfileId =?`,
            [req.params.id]
          );
          var apiReq = unirest("POST", "https://www.fast2sms.com/dev/bulkV2");
          apiReq.headers({
            authorization: process.env.SMS_API_KEY,
          });
          apiReq.form({
            sender_id: "TXTIND",
            message: `Dear Customer, We have scheduled your vehicle inspection on ${InspectionDate}. For more information contact support. Thank you.`,
            route: "v3",
            numbers: customer[0].MobileNumber,
          });
          apiReq.end(function (res) {
            if (res.error) {
              return failure(res, "Error while sending the message", error);
            }
            console.log(res.body);
          });
        }
        return success(res, "Vehicle Profile Updated Successfully", updatedData);
      }
      return success(res, "Something went wrong while updating vehicle Profile", []);
    } catch (error) {
      return failure(res, "Error updating vehicle profile", error.message);
    }
  },
  /**
   * Drop vehicle profile
   * @param {Request} req
   * @param {Response} res
   * @param {Number} vehicleId
   */
  dropVehicleProfile: async (req, res) => {
    try {
      let vehicleId = parseInt(req.params.id);

      if (vehicleId == null || vehicleId == "" || isNaN(vehicleId)) {
        return failure(res, "Invalid format or vehicle id missing", []);
      }
      let result = await query(`update VehicleProfile set Vehicle_Stage_Id=46 where VehicleProfileId=?`, [vehicleId]);

      if (result.affectedRows > 0) {
        let ans = await query(`insert into Vehicle_Stage_Details (StageMasterId,Vehicle_Id,Current_Stage_Status) values (?,?,?)`, [46, vehicleId, 1]);
        return success(res, "Vehicle dropped successfully", result);
      }
    } catch (err) {
      return failure(res, "Error updating vehicle profile", err);
    }
  },
  /**
   *  vehicle profile stage dropdown
   * @param {Request} req
   * @param {Response} res
   * @param {Number} stageId
   */
  vehicleProfileStage: async (req, res) => {
    try {
      let stage = req.params.stageCategory;

      if (stage === null || stage === undefined) {
        return failure(res, "Invalid format or stage id missing", []);
      }
      let result = await query(
        `select
      sm.Stage_Master_Id,
      sm.Stage_Name,
      sm.Stage_Parent_Id,
      sm.Stage_Category
    from
      Stage_Master sm
    where
    sm.Stage_Category= ?`,
        [stage]
      );
      if (result.length === 0) {
        return success(res, "No Data found please check input params once again", []);
      }
      return success(res, "Vehicle stage dropdown values fetched successfully", result);
    } catch (err) {
      return failure(res, "Error fetching values ", err);
    }
  },
  /**
   *  fetch vehicle completed resp stages
   * @param {Request} req
   * @param {Response} res
   * @param {Number} completed_stageId
   */
  getStageWiseVehiclesData: async (req, res) => {
    try {
      let subStage = parseInt(req.params.subStage);
      let stage = req.params.stage;

      if (subStage === null || subStage === undefined || isNaN(subStage) || stage === null || stage === undefined) {
        return failure(res, "Invalid format or data missing", []);
      }
      let result = await query(
        `select
        vsd.Vehicle_Id,
        vp.Registration_No,
        vsd.StageMasterId,
        sm.Stage_Name,
        sm.Stage_Category,
        vsd.Created_On,
        vsd.Updated_On,
       ca.Verified as "AgreementAccepted",
       l.LeadId,
       l.MobileNumber
      from
        Vehicle_Stage_Details vsd
        join VehicleProfile vp on vp.VehicleProfileId = vsd.Vehicle_Id
        join Stage_Master sm on sm.Stage_Master_Id = vsd.StageMasterId
        join \`Lead\` l on l.Vehicle_Profile = vp.VehicleProfileId
        left join customer_agreement ca on l.LeadId = ca.LeadId
      where
        sm.Stage_Parent_Id= ? and sm.Stage_Category= ? and vp.Active=1`,
        [subStage, stage]
      );
      if (result.length === 0) {
        return success(res, "No vehicles found for current stage", []);
      }
      return success(res, "Vehicle data fetched ", result);
    } catch (err) {
      console.error(err);
      return failure(res, "Error fetching values ", err);
    }
  },
  /**
   *  fetch upcoming vehicles for current stage
   * @param {Request} req
   * @param {Response} res
   * @param {Number} currentStage
   * @param {Number} previousStage
   */
  getUpcomingVehicleForCurrentStage: async (req, res) => {
    try {
      let currentStage = req.params.currentStage;
      let previousStageId = parseInt(req.params.previousStageId);

      if (previousStageId === null || previousStageId === undefined || isNaN(previousStageId) || currentStage === null || currentStage === undefined) {
        return failure(res, "Invalid format or stage id missing", []);
      }
      let result = await query(
        `select
        rp.RiderName,
        rp.MobileNumber,
        vp.VehicleProfileId,
        vp.Registration_No,
        vp.RegistrationDate,
        vp.RC_Address,
        vsd.StageMasterId,
        vsd.Created_On 
      from
        Vehicle_Stage_Details vsd
        join VehicleProfile vp on vp.VehicleProfileId=vsd.Vehicle_Id
        join RiderProfile rp on rp.RiderProfileId = vp.RiderProfileId
        join Stage_Master sm on sm.Stage_Master_Id=vsd.StageMasterId
      where
        vsd.StageMasterId = ? AND vp.Active=1
        AND vsd.vehicle_id NOT IN (
          SELECT
            vsd.vehicle_id
          FROM
            Vehicle_Stage_Details vsd
            join Stage_Master sm on sm.Stage_Master_Id=vsd.StageMasterId
          WHERE
          sm.Stage_Category = ?
        ) order by vp.UpdatedOn desc;`,
        [previousStageId, currentStage]
      );
      if (result.length === 0) {
        return success(res, "No vehicles found for current stage", []);
      }
      return success(res, "Vehicle data fetched ", result);
    } catch (err) {
      return failure(res, "Error fetching values ", err);
    }
  },
  /**
   *  fetch awaiting vehicles for repair criteria stage
   * @param {Request} req
   * @param {Response} res
   */
  getAwaitingApprovalVehicle: async (req, res) => {
    try {
      let result = await query(
        `select
        vp.VehicleProfileId,
        vp.Registration_No,
        rp.RiderName,
        rp.MobileNumber,
        sm.Stage_Master_Id,
        sm.Stage_Name
      from
        VehicleProfile vp
        left join Stage_Master sm on sm.Stage_Master_Id = vp.Vehicle_Stage_Id
         join RiderProfile rp on rp.RiderProfileId = vp.RiderProfileId
      where
        vp.Vehicle_Stage_Id in (38,39) and vp.Active=1`
      );
      if (result.length === 0) {
        return success(res, "No vehicles found for current stage", []);
      }
      return success(res, "Vehicle data fetched ", result);
    } catch (err) {
      return failure(res, "Error fetching values ", err);
    }
  },
  /**
   * @param {Number} inspType 
   * @param {Request} req
   * @param {Response} res
   */
  getVehicleInspectionsStatus:async (req,res) =>{
    try {
      let result = await query(
        ` SELECT DISTINCT
        vp.Registration_No,
        vp.VehicleProfileId,
         vp.CreatedOn , vp.UpdatedOn,
        CASE
            WHEN qri.VehicleProfileId IS NOT NULL THEN 1
            ELSE 0
        END AS inspection_status,
        l.LeadName
    FROM 
        VehicleProfile vp 
    LEFT JOIN 
        QuestionResponseInput qri ON qri.VehicleProfileId = vp.VehicleProfileId AND qri.TypeMasterId = ${req.params.inspType}
        left join \`Lead\` as l on l.Vehicle_Profile = vp.VehicleProfileId`
      );
      if (result.length === 0) {
        return success(res, "No vehicles found ", []);
      }
      return success(res, "Vehicle data fetched ", result);
    } catch (err) {
      console.error(err);
      return failure(res, "Error fetching values ", err);
    }
  },
  getDeviceIdAndBatteryId: async (req, res) => {
    try {
      let vehicleProfileId = parseInt(req.params.vehicleId);
    
      let result = await query(
        `select
            hia.Serial_No  as battery_id,
            vp.VehicleProfileId,
            vp.Registration_No,
              vp.DeviceMasterId,
        dm.IoTDeviceId
          from
            VehicleProfile vp 
            left join DeviceMaster dm on dm.DeviceMasterId = vp.DeviceMasterId
            left join hrc_job_card hjc on hjc.VehicleProfileId = vp.VehicleProfileId
            left join hrc_inventory_allocation hia on hia.JobCardId = hjc.JobCardId
          where hia.Component_Id = 120 and vp.VehicleProfileId = ${vehicleProfileId}
        `
      );
      if (result.length === 0) {
        return success(res, "No data found", []);
      }
      return success(res, "Vehicle data fetched ", result);
    } catch (err) {
      return failure(res, "Error fetching values ", err);
    }
  },
};
