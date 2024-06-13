module.exports = class {
  /**
   *
   * @param {Number} VehicleProfileId
   * @param {Number} RiderProfileId
   * @param {String} RiderName
   * @param {Number} MobileNumber
   * @param {Number} VehicleRegistrationNumber
   * @param {Number} City_Id
   * @param {String} City_Name
   * @param {String} Locality
   * @param {String} RTOLocation
   * @param {Number} ManufacturingYear
   * @param {Timestamp} RegistrationDate
   * @param {Number} OwnerCount
   * @param {Number} IsModified
   * @param {String} VehicleColor
   * @param {String} IsRepainted
   * @param {String} LoanHistory
   * @param {String} Insurance
   * @param {String} Variant
   * @param {Number} KmsDriven
   * @param {Number} IsBlacklisted
   * @param {Number} IsActiveChallan
   * @param {String} OwnerProfession
   * @param {Number} SellerIsOwner
   * @param {Number} IsInUse
   * @param {Number} Vehicle_Stage_Id
   * @param {String} Stage_Name
   * @param {Timestamp} CreatedOn
   * @param {Timestamp} UpdatedOn
   * @param {Number} ClientMasterId,
   * @param {String} ClientName,
   * @param {Number}ClientNumber,
   * @param {String}ClientEmail,
   * @param {String}ClientAddress
   */
  constructor(
    VehicleProfileId,
    RiderProfileId,
    RiderName,
    MobileNumber,
    Registration_No,
    Registration_Type,
    Vehicle_Type,
    Type,
    City_Id,
    City_Name,
    RTOLocation,
    RC_Address,
    ManufacturingYear,
    RegistrationDate,
    OwnerCount,
    IsModified,
    VehicleColor,
    IsRepainted,
    LoanHistory,
    Insurance,
    Variant,
    KmsDriven,
    IsBlacklisted,
    IsActiveChallan,
    OwnerProfession,
    SellerIsOwner,
    Vehicle_Stage_Id,
    Chasis_No,
    Engine_No,
    HP_Lease,
    Images,
    Brand_Id,
    Brand_Name,
    Model_Id,
    Model_Name,
    Rear_Whee_ld,
    Wheel_type,
    CreatedOn,
    UpdatedOn,
    ClientMasterId,
    ClientName,
    ClientNumber,
    ClientEmail,
    ClientAddress,
    IoTDeviceId,
    Remarks,
    OutstandingAmount,
    LoanBankName,
    InsuranceCompany,
    PolicyNumber,
    PolicyValidTill,
    AvgDailyKm,
    TransportType,
    TypeName,
    RepaintedColor
  ) {
    this.VehicleProfileId = VehicleProfileId;
    this.RiderProfileId = RiderProfileId;
    this.RiderName = RiderName;
    this.MobileNumber = MobileNumber;
    this.Registration_No = Registration_No;
    this.Registration_Type = Registration_Type;
    this.Vehicle_Type = Vehicle_Type;
    this.Type = Type;
    this.City_Id = City_Id;
    this.City_Name = City_Name;
    this.RTOLocation = RTOLocation;
    this.RC_Address = RC_Address;
    this.ManufacturingYear = ManufacturingYear;
    this.RegistrationDate = RegistrationDate;
    this.OwnerCount = OwnerCount;
    this.IsModified = IsModified;
    this.VehicleColor = VehicleColor;
    this.IsRepainted = IsRepainted;
    this.LoanHistory = LoanHistory;
    this.Insurance = Insurance;
    this.Variant = Variant;
    this.KmsDriven = KmsDriven;
    this.IsBlacklisted = IsBlacklisted;
    this.IsActiveChallan = IsActiveChallan;
    this.OwnerProfession = OwnerProfession;
    this.SellerIsOwner = SellerIsOwner;
    this.Vehicle_Stage_Id = Vehicle_Stage_Id;
    this.Chasis_No = Chasis_No;
    this.Engine_No = Engine_No;
    this.HP_Lease = HP_Lease;
    this.Images = Images;
    (this.Brand_Id = Brand_Id), (this.Brand_Name = Brand_Name);
    this.Model_Id = Model_Id;
    this.Model_Name = Model_Name;
    this.Rear_Whee_ld = Rear_Whee_ld;
    this.Wheel_type = Wheel_type;
    this.CreatedOn = CreatedOn;
    this.UpdatedOn = UpdatedOn;
    (this.ClientMasterId = ClientMasterId), (this.ClientName = ClientName), (this.ClientNumber = ClientNumber), (this.ClientEmail = ClientEmail), (this.ClientAddress = ClientAddress);
    this.IoTDeviceId = IoTDeviceId;
    this.Remarks = Remarks;
    this.OutstandingAmount = OutstandingAmount;
    this.LoanBankName = LoanBankName;
    this.InsuranceCompany = InsuranceCompany;
    this.PolicyNumber = PolicyNumber;
    this.PolicyValidTill = PolicyValidTill;
    this.AvgDailyKm = AvgDailyKm;
    this.TransportType = TransportType;
    this.TypeName = TypeName;
    this.RepaintedColor = RepaintedColor;
  }

  static fromJSON(j) {
    return new this(
      j["VehicleProfileId"],
      j["RiderProfileId"],
      j["RiderName"],
      j["MobileNumber"],
      j["Registration_No"],
      j["Registration_Type"],
      j["Vehicle_Type"],
      j["Type"],
      j["City_Id"],
      j["City_Name"],
      j["RTOLocation"],
      j["RC_Address"],
      j["ManufacturingYear"],
      j["RegistrationDate"],
      j["OwnerCount"],
      j["IsModified"][0],
      j["VehicleColor"],
      j["IsRepainted"][0],
      j["LoanHistory"],
      j["Insurance"],
      j["Variant"],
      j["KmsDriven"],
      j["IsBlacklisted"][0],
      j["IsActiveChallan"][0],
      j["OwnerProfession"],
      j["SellerIsOwner"][0],
      j["Vehicle_Stage_Id"],
      j["Chasis_No"],
      j["Engine_No"],
      j["HP_Lease"],
      j["Images"],
      j["Brand_Id"],
      j["Brand_Name"],
      j["Model_Id"],
      j["Model_Name"],
      j["Rear_Whee_ld"],
      j["Wheel_type"],
      j["CreatedOn"],
      j["UpdatedOn"],
      j["ClientMasterId"],
      j["ClientName"],
      j["ClientNumber"],
      j["ClientEmail"],
      j["ClientAddress"],
      j["IoTDeviceId"] == null ? "" : j["IoTDeviceId"],
      j["Remarks"],
      j["OutstandingAmount"],
      j["LoanBankName"],
      j["InsuranceCompany"],
      j["PolicyNumber"],
      j["PolicyValidTill"],
      j["AvgDailyKm"],
      j["TransportType"],
      j["TypeName"],
      j["RepaintedColor"]
    );
  }
};
