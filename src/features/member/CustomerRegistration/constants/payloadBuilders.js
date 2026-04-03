/**
 * Build Individual Registration Payload
 * @param {Object} formData - Form data object containing all individual fields
 * @param {Array} countries - Array of country objects with { id, name }
 * @param {Array} cities - Array of city objects with { id, name }
 * @returns {Object} Individual payload ready for API submission
 */
export function buildIndividualPayload(formData, countries = [], cities = []) {
  return {
    FName: formData.firstName,
    MName: formData.middleName,
    LName: formData.surname,
    Employed: !!formData.memberEmployed,
    Title: Number(formData.title) || '',
    NatCode: formData.nationality ? (countries.find(c => c.name === formData.nationality)?.id || 0) : 0,
    DOB: formData.dateOfBirth,
    DateJoin: formData.dateJoined,
    gender: Number(formData.gender) || '',
    Marital: Number(formData.maritalStatus) || '',
    IDType: Number(formData.idType) || '',
    IDNumber: formData.idNumber,
    PlaceIssued: formData.placeIssue,
    DateIssue: formData.dateIssued,
    DateExpire: formData.expiryDate,
    Region: Number(formData.region) || '',
    District: Number(formData.district) || '',
    Ward: Number(formData.ward) || '',
    Residents: !!formData.residency,
    CustType: 'C',
    Country: formData.country || '',
    City: formData.city ? (cities.find(c => c.name === formData.city)?.id || 0) : 0,
    Street: formData.address,
    Tel: formData.mobilePhoneNumber,
    Tel1: formData.mobilePhoneNumber,
    Email: formData.emailAddress,
    Employer: Number(formData.employer) || '',
    Salary: Number(formData.currentSalary) || '',
    Shares: Number(formData.sharesPurchase) || '',
    RegFee: Number(formData.registrationFee) || '',
    RefName: formData.refereeName,
    RefEmail: formData.refereeEmailAddress,
    RefAddress: formData.refereeAddress,
    RefMobile: formData.refereeMobilePhone,
    NokName: formData.nextOfKinName,
    NokAddress: formData.nextOfKinAddress,
    NokMobile: formData.nextOfKinMobilePhone,
    StaffNo: formData.employmentNumber,
    SharePrice: Number(formData.sharePrice) || '',
    Signatory: formData.signatory1,
    MemberPicture: null,
    MemberSignature: null,
  };
}

/**
 * Build Institution Registration Payload
 * @param {Object} formData - Form data object containing all institution fields
 * @param {Array} institutionBranches - Array of institution branches
 * @param {Array} cities - Array of city objects with { id, name }
 * @returns {Object} Institution payload ready for API submission
 */
export function buildInstitutionPayload(formData, institutionBranches = [], cities = []) {
  return {
    CustName: formData.institutionName, // Mandatory
    BizCategory: Number(formData.institutionNature) || 0, // Mandatory (should be mapped from dropdown)
    Country: formData.country || '', // Mandatory
    City: formData.city ? (cities.find(c => c.name === formData.city)?.id || 0) : 0, // Mandatory
    Street: formData.address, // Mandatory
    Tel: formData.mobilePhoneNumber, // Mandatory
    Tel1: formData.mobilePhoneNumber,
    Email: formData.emailAddress,
    IncorporationNo: formData.institutionIncoporationNumber,
    Tin: formData.institutionTIN,
    IncorporationDate: formData.institutionIncoporationDate,
    DateJoin: formData.institutionDateJoined,
    Residents: formData.institutionResidency === 'resident',
    CustType: 'C',
    ChairName: formData.chairName, // Mandatory
    ChairTin: formData.chairTIN, // Mandatory
    ChairTel: formData.chairMobilePhone, // Mandatory
    ChairMail: formData.chairEmailAddress, // Mandatory
    ChairSign: !!formData.chairAccountSignatory, // Mandatory
    ViceName: formData.viceChairName, // Mandatory
    ViceTin: formData.viceChairTIN, // Mandatory
    ViceTel: formData.viceChairMobilePhone, // Mandatory
    ViceMail: formData.viceChairEmailAddress, // Mandatory
    ViceSign: !!formData.viceChairAccountSignatory, // Mandatory
    TreasurerName: formData.treasurerName,
    TreasurerTin: formData.treasurerTIN,
    TreasurerTel: formData.treasurerMobilePhone,
    TreasurerMail: formData.treasurerEmailAddress,
    TreasurerSign: !!formData.treasurerAccountSignatory,
    SecName: formData.secretaryName,
    SecTin: formData.secretaryTIN,
    SecTel: formData.secretaryMobilePhone,
    SecMail: formData.secretaryEmailAddress,
    SecSign: !!formData.secretaryAccountSignatory,
    Ref1Name: formData.referenceDetailsName,
    Ref1Address: formData.referenceDetailsAddress,
    Ref1Tel: formData.referenceDetailsMobilePhone,
    Ref1Mail: formData.referenceDetailsEmailAddress,
    Ref2Name: '',
    Ref2Address: '',
    Ref2Tel: '',
    Ref2Mail: '',
    Ref3Name: '',
    Ref3Address: '',
    Ref3Tel: '',
    Ref3Mail: '',
    Ref4Name: '',
    Ref4Address: '',
    Ref4Tel: '',
    Ref4Mail: '',
    RegFee: Number(formData.registrationFee) || 0,
    SharePrice: Number(formData.sharePrice) || 0,
    Shares: Number(formData.sharesPurchase) || 0,
    SaveAmount: Number(formData.savingAmount) || 0,
    SaveType: formData.savingMode === 'fixed',
    Sign1: formData.signatory1, // Mandatory
    Sign2: '', // Mandatory (should be mapped from form if available)
    Sign3: formData.signatory3,
    Sign4: '',
    // CompanyId will be set from backend response after registration
    // BranchId is set from branches API, not user input
    BranchId: institutionBranches && institutionBranches.length > 0 ? 1 : 0, // Default to first branch (1-based index)
    BatId: 0,
    MemType: 0, // Mandatory (should be mapped from dropdown)
    gender: Number(formData.gender) || 0, // Mandatory
    Region: Number(formData.institutionRegion) || 0,
    District: Number(formData.institutionDistrict) || 0,
    Ward: Number(formData.institutionWard) || 0,
    MemberPicture: null,
    MemberSignature: null,
  };
}
