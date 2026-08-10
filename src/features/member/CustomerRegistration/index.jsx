
import React, { useEffect, useRef, useState } from 'react';
import * as Sentry from "@sentry/react";
import { DataGrid } from '@mui/x-data-grid';
import {
  Alert,
  AlertTitle,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import dayjs from 'dayjs';
import { useRegisterInstitution } from './hooks/useRegisterInstitution';
import { useRegisterIndividual } from './hooks/useRegisterIndividual';
import { useIdTypes } from './hooks/useIdTypes';
import { useBanks } from './hooks/useBanks';
import { CurrencyAdornment } from '../../../components/FieldAdornments';
import { useMemberDetails } from '../../../hooks/useMemberDetails';
import { useInstitutionDetails } from './hooks/useInstitutionDetails';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { useCities } from './hooks/useCities';
import { useDistricts } from './hooks/useDistricts';
import { useWards } from './hooks/useWards';
import { initialForm } from './constants/initialFormData';
import { buildIndividualPayload, buildInstitutionPayload } from './constants/payloadBuilders';
import { useUpdateInstitution } from './hooks/useUpdateInstitution';
import { useAuthStore } from '../../../store/authStore';
import { getFullApiUrl } from '../../../utils/apiConfig';

// Tab group styles
const mainTabGroupSx = {
  minHeight: 52,
  mb: 2,
  p: 0.6,
  borderRadius: 2.5,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'action.hover',
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTab-root': {
    minHeight: 38,
    textTransform: 'none',
    borderRadius: 1.75,
    fontWeight: 700,
    fontSize: '0.95rem',
    color: 'text.secondary',
    px: 2,
    transition: 'all 0.2s ease',
  },
  '& .MuiTab-root:hover': {
    color: 'text.primary',
    bgcolor: 'action.selected',
  },
  '& .MuiTab-root.Mui-selected': {
    color: 'primary.main',
    bgcolor: 'background.paper',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.10)',
  },
};

const detailTabGroupSx = {
  minHeight: 50,
  mb: 2,
  p: 0.6,
  borderRadius: 2,
  bgcolor: 'action.hover',
  border: '1px solid',
  borderColor: 'divider',
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTab-root': {
    minHeight: 36,
    textTransform: 'none',
    borderRadius: 1.5,
    fontWeight: 600,
    fontSize: '0.88rem',
    color: 'text.secondary',
    px: 1.8,
    transition: 'all 0.2s ease',
  },
  '& .MuiTab-root:hover': {
    color: 'text.primary',
    bgcolor: 'action.selected',
  },
  '& .MuiTab-root.Mui-selected': {
    color: 'primary.main',
    bgcolor: 'background.paper',
    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
  },
};

export default function CustomerRegistration(props) {
    // Group Member state and handlers
    const [groupMembers, setGroupMembers] = useState([
      {
        id: Date.now() + Math.random(),
        firstName: '',
        middleName: '',
        lastName: '',
        phoneNumber: '',
      },
    ]);

    const handleAddGroupMemberCard = () => {
      setGroupMembers(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          firstName: '',
          middleName: '',
          lastName: '',
          phoneNumber: '',
        },
      ]);
    };

    const handleGroupMemberChange = (id, field, value) => {
      setGroupMembers(prev =>
        prev.map(member =>
          member.id === id ? { ...member, [field]: value } : member
        )
      );
    };
  const { registerInstitution } = useRegisterInstitution();
  const { registerIndividual } = useRegisterIndividual();
  const { cities } = useCities();
  const { districts } = useDistricts();
  const { wards } = useWards();
  // Map numeric city id (or legacy ncity) to the city id string that the UI dropdown expects
  const mapCityById = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const numeric = Number(val);
    if (!Number.isNaN(numeric)) {
      // If cities list is available and contains this id, return the id as string
      if (Array.isArray(cities) && cities.length > 0) {
        const found = cities.find((c) => Number(c.id) === numeric || String(c.id) === String(val));
        if (found) return String(found.name || found.id);
        // If numeric doesn't match any city id, treat it as a 1-based index into the cities list
        if (numeric > 0 && numeric <= cities.length) {
          const byIndex = cities[numeric - 1];
          if (byIndex && (byIndex.name || byIndex.name === '')) return String(byIndex.name);
        }
      }
      return String(numeric);
    }
    // If not numeric, try matching by name and return the matching id
    if (Array.isArray(cities) && cities.length > 0) {
      const foundByName = cities.find((c) => (c.name || '').toLowerCase() === String(val).toLowerCase());
      if (foundByName) return String(foundByName.name);
    }
    return String(val);
  };
  // Map numeric country id (cou_id) to country name for the nationality dropdown
  const mapCountryById = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const numeric = Number(val);
    if (!Number.isNaN(numeric)) {
      if (Array.isArray(countries) && countries.length > 0) {
        const found = countries.find((c) => Number(c.id) === numeric || String(c.id) === String(val));
        if (found) return String(found.name);
        // If numeric doesn't match any id, treat as 1-based index into countries
        if (numeric > 0 && numeric <= countries.length) {
          const byIndex = countries[numeric - 1];
          if (byIndex && byIndex.name) return String(byIndex.name);
        }
      }
      return String(numeric);
    }
    if (Array.isArray(countries) && countries.length > 0) {
      const foundByName = countries.find((c) => (c.name || '').toLowerCase() === String(val).toLowerCase());
      if (foundByName) return String(foundByName.name);
    }
    return String(val);
  };
  // If you need user, get it from props.user, else remove
  const user = props.user;
  const isReadOnlyRole = Boolean(user?.access?.readOnly);
  const [recentMember, setRecentMember] = useState(null);
  const [mainTab, setMainTab] = useState(0);
  const [detailTab, setDetailTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [saveValidationErrors, setSaveValidationErrors] = useState(null);
  const [pendingFormReset, setPendingFormReset] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [institutionBranches, setInstitutionBranches] = useState([]);
  const [countries, setCountries] = useState([]);
  const { fetchMemberDetails, loading: loadingMemberDetails } = useMemberDetails();

  // Fetch institution branches for branch dropdowns
  useEffect(() => {
    const loadInstitutionBranches = async () => {
      try {
        // Use relative path so Vite proxy can intercept and handle CORS
        const url = getFullApiUrl('/api/remote-branches/branches');
        const response = await fetch(url);
        if (!response.ok) return;
        const payload = await response.json();
        const branchOptions = Array.from(
          new Set(
            (Array.isArray(payload) ? payload : [])
              .map((item) => (item?.br_name || item?.branchName || item?.name || '').trim())
              .filter(Boolean)
          )
        );
        setInstitutionBranches(branchOptions);
      } catch {
        setInstitutionBranches([]);
      }
    };
    loadInstitutionBranches();
  }, []);

  // Fetch countries for nationality and country of residence
  useEffect(() => {
    const loadCountries = async () => {
      try {
        // Use relative path so Vite proxy can intercept and handle CORS
        const url = getFullApiUrl('/api/remote-countries/countries');
        const response = await fetch(url);
        if (!response.ok) return;
        const payload = await response.json();
        const countryOptions = (Array.isArray(payload) ? payload : [])
          .map((item) => ({
            id: item.cou_id || item.id || 0,
            name: (item.cou_name || '').trim(),
          }))
          .filter((item) => item.name && item.id)
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryOptions);
      } catch {
        setCountries([]);
      }
    };
    loadCountries();
  }, []);

  const [individualSearchCode, setIndividualSearchCode] = useState('');
  const [institutionSearchCode, setInstitutionSearchCode] = useState('');
  const [isExistingMember, setIsExistingMember] = useState(false);
  const { fetchInstitutionDetails, loading: loadingInstitutionDetails } = useInstitutionDetails();
  const { updateInstitution } = useUpdateInstitution();

  const handleFillFromMember = async () => {
    setSaveValidationErrors(null);
    if (!individualSearchCode) return setStatusMessage('Enter member code to search');
    setStatusMessage('');
    try {
      // If the user entered only digits, pad to 6 characters with leading zeros (e.g., 1 -> 000001)
      const codeToUse = String(individualSearchCode || '').trim();
      const paddedCode = /^\d+$/.test(codeToUse) ? codeToUse.padStart(6, '0') : codeToUse;
      const resp = await fetchMemberDetails(paddedCode);
      if (!resp.success) {
        setStatusError(true);
        setStatusMessage(resp.error || 'Member not found');
        return;
      }

      const m = resp.data;
      if (!m) {
        setStatusError(true);
        setStatusMessage('Member not found');
        return;
      }

      // If backend returned an entry whose name fields are empty or whitespace-only,
      // it is likely an institution record — don't refill individual form.
      const _first = String(m.ccustfname || '');
      const _middle = String(m.ccustmname || '');
      const _last = String(m.ccustlname || '');
      if (_first.trim() === '' && _middle.trim() === '' && _last.trim() === '') {
        setStatusError(true);
        setStatusMessage('The customer code you entered appears to be for an institution, not an individual.');
        return;
      }

      // Map response fields to formData keys (best-effort, follow payload builders)
      

      

      const mapDesignationCode = (val) => {
        if (val === undefined || val === null || val === '') return '';
        const n = Number(val);
        if (Number.isNaN(n)) return String(val);
        switch (n) {
          case 1:
            return 'manager';
          case 2:
            return 'supervisor';
          case 3:
            return 'officer';
          case 4:
            return 'assistant';
          default:
            return String(val);
        }
      };

      const mapMaritalCode = (val) => {
        if (val === undefined || val === null || val === '') return '';
        const n = Number(val);
        if (Number.isNaN(n)) return String(val).toLowerCase();
        switch (n) {
          case 1:
            return 'single';
          case 2:
            return 'married';
          case 3:
            return 'divorced';
          case 4:
            return 'widowed';
          default:
            return '';
        }
      };

      const mapDepartmentCode = (val) => {
        if (val === undefined || val === null || val === '') return '';
        const n = Number(val);
        if (Number.isNaN(n)) return String(val);
        switch (n) {
          case 1:
            return 'finance';
          case 2:
            return 'operations';
          case 3:
            return 'hr';
          case 4:
            return 'it';
          default:
            return String(val);
        }
      };

      const mapped = {
        // Institution fields
        institutionType: (function () {
          const mem = Number(m.mem_type ?? m.MemType ?? m.memtype ?? m.Memtype ?? NaN);
          if (mem === 2) return 'Group';
          if (mem === 3) return 'Corporate / Institution';
          return '';
        })(),
        institutionName: m.CustName || m.custname || '',
        institutionNature: m.BizCategory || m.bizcategory || m.institutionNature || '',
        institutionMemberCode: m.companyId || m.companyCode || m.ccustcode || '',
        institutionBranch: (function () {
          const raw = m.branch_id ?? m.branchid ?? m.branch ?? '';
          const num = Number(raw);
          if (!Number.isNaN(num) && num > 0) {
            if (Array.isArray(institutionBranches) && institutionBranches.length > 0) {
              const byIndex = institutionBranches[num - 1];
              if (byIndex) return byIndex;
            }
            setPendingBranchId(num);
            return String(num);
          }
          return String(raw || '');
        })(),
        institutionIncoporationNumber: m.IncorporationNo || m.incorporationNo || m.incoporationNo || '',
        institutionTIN: m.Tin || m.tin || m.tinno || '',
        institutionIncoporationDate: m.IncorporationDate || m.incorporationDate || '',
        institutionDateJoined: m.DateJoin || m.datejoin || m.datejoin_raw || '',
        institutionRegion: m.Region ? String(m.Region) : (m.region ? String(m.region) : ''),
        institutionDistrict: m.District ? String(m.District) : (m.district ? String(m.district) : ''),
        institutionWard: m.Ward ? String(m.Ward) : (m.ward ? String(m.ward) : ''),
        institutionResidency: (m.Residents === true || m.Residents === 1) ? 'resident' : (m.residency || ''),

        // Individual / common fields
        firstName: (m.ccustfname || m.FName || m.firstName || '').trim(),
        middleName: (m.ccustmname || m.MName || m.middleName || '').trim(),
        surname: (m.ccustlname || m.LName || m.surname || '').trim(),
        memberCode: (m.ccustcode || m.memberCode || m.clientCode || '').trim(),
        branch: m.branch || m.branch_name || (m.branch_id ? String(m.branch_id) : ''),
        memberEmployed: m.Employed === 1 || m.Employed === true || !!m.memberEmployed,
        sendSms: !!m.sendSms,
        registerMobileWallet: !!m.registerMobileWallet,
        title: m.ccusttitle || m.Title || '',
        nationality: (function () {
          const raw = m.cou_id ?? m.NatCode ?? m.Country ?? '';
          const num = Number(raw);
          if (!Number.isNaN(num) && num > 0) {
            if (Array.isArray(countries) && countries.length > 0) {
              const found = countries.find((c) => Number(c.id) === num || String(c.id) === String(raw));
              if (found) return String(found.name);
              if (num > 0 && num <= countries.length) return String(countries[num - 1].name);
            }
            setPendingCouId(num);
            return String(num);
          }
          return mapCountryById(raw) || (m.Country || '');
        })(),
        tribe: m.tribe || '',
        levelOfEducation: m.levelOfEducation || m.levelofedu || '',
        dateOfBirth: m.ddatebirth && m.ddatebirth !== '1900-01-01T00:00:00' ? (String(m.ddatebirth).split('T')[0]) : (m.DOB || ''),
        dateJoined: m.datejoin || m.DateJoin || '',
        gender: (typeof m.gender === 'boolean') ? (m.gender ? '1' : '2') : (m.gender ? String(m.gender) : ''),
        maritalStatus: mapMaritalCode(m.Marital ?? m.marital),
        idType: mapIdTypeToOption(m.IDType ?? m.idtype),
        idNumber: m.IDNumber || m.cpassno || m.idNumber || '',
        placeIssue: m.PlaceIssued || m.cplacissue || '',
        dateIssued: m.DateIssue && m.DateIssue !== '1900-01-01T00:00:00' ? String(m.DateIssue).split('T')[0] : (m.ddateissue && m.ddateissue !== '1900-01-01T00:00:00' ? String(m.ddateissue).split('T')[0] : ''),
        expiryDate: m.DateExpire && m.DateExpire !== '1900-01-01T00:00:00' ? String(m.DateExpire).split('T')[0] : (m.ddateexpire && m.ddateexpire !== '1900-01-01T00:00:00' ? String(m.ddateexpire).split('T')[0] : ''),
        povertyLevel: m.povertyLevel || '',
        region: m.Region ? String(m.Region) : (m.region ? String(m.region) : (m.nregion ? String(m.nregion) : '')),
        district: m.District ? String(m.District) : (m.district ? String(m.district) : (m.ndist ? String(m.ndist) : '')),
        ward: m.Ward ? String(m.Ward) : (m.ward ? String(m.ward) : (m.nward ? String(m.nward) : '')),
        country: m.cou_id ? Number(m.cou_id) : (m.Country || ''),
        city: mapCityById(m.ncity) || (m.City || m.city || ''),
        address: m.caddr1 || m.Street || m.address || '',
        mobilePhoneNumber: m.cmobile1 || m.cmobile || m.Tel || '',
        emailAddress: m.cemail || m.Email || '',

        // Referees and next of kin
        refereeName: m.cname1 || m.Ref1Name || '',
        refereeAddress: m.caddr1 || m.Ref1Address || '',
        refereeMobilePhone: m.cmobile1 || m.Ref1Tel || '',
        refereeEmailAddress: m.cemail1 || m.Ref1Mail || '',
        nextOfKinName: (m.nextOfKins && m.nextOfKins[0] && (m.nextOfKins[0].name || m.nextOfKins[0].Name)) || m.NokName || m.Nok || '',
        nextOfKinAddress: (m.nextOfKins && m.nextOfKins[0] && (m.nextOfKins[0].address || '')) || '',
        nextOfKinRelationship: (m.nextOfKins && m.nextOfKins[0] && (m.nextOfKins[0].relationship || '')) || '',
        nextOfKinMobilePhone: (m.nextOfKins && m.nextOfKins[0] && (m.nextOfKins[0].mobilePhone || '')) || '',

        // Employment
        employer: m.nEmployer || m.Employer || '',
        employmentCountry: m.employmentCountry || '',
        employmentCity: m.employmentCity || m.employment_city || '',
        employmentAddress: m.employmentAddress || '',
        employmentMobilePhone: m.employmentMobilePhone || '',
        employmentEmailAddress: m.employmentEmailAddress || '',
        employmentNumber: m.payroll_id || m.StaffNo || m.employmentNumber || '',
        // Prefer legacy numeric fields from backend: nDesig maps to designation, ndept maps to department
        designation: mapDesignationCode(m.nDesig ?? m.designation),
        department: mapDepartmentCode(m.ndept ?? m.department),
        yearsWithCurrentEmployment: m.yearsWithCurrentEmployment || m.nyears || '',
        currentSalary: m.Salary || m.nSal || m.currentSalary || '',

        // Biometric / files
        biometricPhotoName: m.MemberPictureName || m.biometricPhotoName || m.memPict || m.memPictName || '',
        biometricSignatureName: m.MemberSignatureName || m.biometricSignatureName || m.memsign || m.memSign || '',

        // Financial / membership
        registrationFee: m.RegFee || m.registrationFee || '',
        contributionAccountNumber: m.contributionAccountNumber || '',
        contributionAccountName: m.contributionAccountName || '',
        sharePrice: m.SharePrice || m.nSharePrice || m.sharePrice || '',
        sharesPurchase: m.Shares || m.sharesPurchase || '',
        shareValue: m.shareValue || '',
        savingMode: m.SaveType ? (m.SaveType ? 'fixed' : '') : (m.savingMode || ''),
        savingAmount: m.SaveAmount || m.nSaveAmt || m.savingAmount || '',
        accountSignatory: !!m.accountSignatory,
        deductedFromSourcePayroll: !!m.deductedFromSourcePayroll,
        residency: (m.Residents === true || m.residents === true || m.residency) ? 'resident' : '',

        // Institution officers / signatories
        chairName: m.ChairName || m.chairName || '',
        chairTIN: m.ChairTin || m.chairTIN || '',
        chairMobilePhone: m.ChairTel || m.chairMobilePhone || '',
        chairEmailAddress: m.ChairMail || m.chairEmailAddress || '',
        chairAccountSignatory: !!m.ChairSign || !!m.chairAccountSignatory,
        viceChairName: m.ViceName || m.viceChairName || '',
        viceChairTIN: m.ViceTin || m.viceChairTIN || '',
        viceChairMobilePhone: m.ViceTel || m.viceChairMobilePhone || '',
        viceChairEmailAddress: m.ViceMail || m.viceChairEmailAddress || '',
        viceChairAccountSignatory: !!m.ViceSign || !!m.viceChairAccountSignatory,
        treasurerName: m.TreasurerName || m.treasurerName || '',
        treasurerTIN: m.TreasurerTin || m.treasurerTIN || '',
        treasurerMobilePhone: m.TreasurerTel || m.treasurerMobilePhone || '',
        treasurerEmailAddress: m.TreasurerMail || m.treasurerEmailAddress || '',
        treasurerAccountSignatory: !!m.TreasurerSign || !!m.treasurerAccountSignatory,
        secretaryName: m.SecName || m.secretaryName || '',
        secretaryTIN: m.SecTin || m.secretaryTIN || '',
        secretaryMobilePhone: m.SecTel || m.secretaryMobilePhone || '',
        secretaryEmailAddress: m.SecMail || m.secretaryEmailAddress || '',
        secretaryAccountSignatory: !!m.SecSign || !!m.secretaryAccountSignatory,

        // References
        referenceDetailsName: m.Ref1Name || m.referenceDetailsName || '',
        referenceDetailsAddress: m.Ref1Address || m.referenceDetailsAddress || '',
        referenceDetailsMobilePhone: m.Ref1Tel || m.referenceDetailsMobilePhone || '',
        referenceDetailsEmailAddress: m.Ref1Mail || m.referenceDetailsEmailAddress || '',

        // Signatories / defaults
        signatory1: m.cSignatory || m.Sign1 || m.signatory1 || '',
        signatory3: m.Sign3 || m.signatory3 || '',
        defaultBatch: m.BatId || m.defaultBatch || '',
      };

      // Trim all top-level string fields returned from backend before setting form data
      const trimAllStrings = (obj) => {
        const out = {};
        if (!obj || typeof obj !== 'object') return out;
        Object.keys(obj).forEach((k) => {
          const v = obj[k];
          out[k] = (typeof v === 'string') ? v.trim() : v;
        });
        return out;
      };

      // If backend returned inline base64 in the biometric name fields, don't put that huge string
      // into the file-name form fields — replace with a friendly placeholder and set preview separately.
      if (isLikelyBase64Image(mapped.biometricPhotoName)) mapped.biometricPhotoName = 'server-photo.jpg';
      if (isLikelyBase64Image(mapped.biometricSignatureName)) mapped.biometricSignatureName = 'server-signature.png';

      setFormData((prev) => ({ ...prev, ...trimAllStrings(mapped) }));
      // If backend returned inline base64 images (or data URLs), convert and set previews
      try {
        const maybePhoto = m.memPict || m.MemberPicture || mapped.biometricPhotoName || '';
        const maybeSign = m.memsign || m.MemberSignature || mapped.biometricSignatureName || '';
        const photoUrl = toDataUrl(maybePhoto);
        const signUrl = toDataUrl(maybeSign);
        if (photoUrl) setPhotoPreviewUrl(photoUrl);
        if (signUrl) setSignaturePreviewUrl(signUrl);
      } catch {
        // ignore preview generation errors
      }
      setIsExistingMember(true);
      // Populate additional next-of-kins and references if present in response
      if (Array.isArray(m.nextOfKins) && m.nextOfKins.length > 0) {
        setAdditionalNextOfKins(m.nextOfKins.map((k, idx) => ({
          id: Date.now() + idx,
          name: (k.name || k.Name || '').toString().trim(),
          address: (k.address || '').toString().trim(),
          relationship: (k.relationship || '').toString().trim(),
          mobilePhone: (k.mobilePhone || k.mobile || '').toString().trim(),
        })));
      }
      if (Array.isArray(m.references) && m.references.length > 0) {
        setAdditionalReferences(m.references.map((r, idx) => ({
          id: Date.now() + idx,
          name: (r.name || r.Name || '').toString().trim(),
          address: (r.address || '').toString().trim(),
          mobilePhone: (r.mobilePhone || r.mobile || '').toString().trim(),
          emailAddress: (r.email || r.emailAddress || '').toString().trim(),
        })));
      }
      setStatusError(false);
      setStatusMessage('Member data loaded. Edit fields as needed.');
    } catch (err) {
      setStatusError(true);
      setStatusMessage(err.message || 'Failed to load member details');
    }
  };

  const handleFillFromInstitution = async () => {
    setSaveValidationErrors(null);
    if (!institutionSearchCode) return setStatusMessage('Enter institution code to search');
    setStatusMessage('');
    try {
      const codeToUse = String(institutionSearchCode || '').trim();
      const paddedCode = /^\d+$/.test(codeToUse) ? codeToUse.padStart(6, '0') : codeToUse;
      const resp = await fetchInstitutionDetails(paddedCode);
      if (!resp.success) {
        setStatusError(true);
        setStatusMessage(resp.error || 'Institution not found');
        return;
      }
      const m = resp.data;
      if (!m) {
        setStatusError(true);
        setStatusMessage('Institution not found');
        return;
      }

      // Map institution response fields into formData (reuse existing mapping approach)
      const mappedInstitution = {
        institutionType: (function () {
          const mem = Number(m.mem_type ?? m.MemType ?? m.memtype ?? m.Memtype ?? NaN);
          if (mem === 2) return 'group';
          if (mem === 3) return 'corporate';
          return '';
        })(),
        // Prefer backend `ccustname` when present, fall back to other name fields
        institutionName: m.ccustname || m.CustName || m.custname || '',
        // Biz category / nature
        institutionNature: m.BizCategory || m.bizcategory || m.bizcat || m.institutionNature || '',
        institutionMemberCode: m.companyId || m.companyCode || m.ccustcode || '',
        institutionBranch: (function () {
          const raw = m.branch_id ?? m.branchid ?? m.branch ?? '';
          const num = Number(raw);
          if (!Number.isNaN(num) && num > 0) {
            if (Array.isArray(institutionBranches) && institutionBranches.length > 0) {
              const byIndex = institutionBranches[num - 1];
              if (byIndex) return byIndex;
            }
            setPendingBranchId(num);
            return String(num);
          }
          return String(raw || '');
        })(),
        // Incorporation number/code and date (legacy INCORPC / INCORPD)
        institutionIncoporationNumber: m.IncorporationNo || m.incoporationNo || m.INCORPC || m.INCORP || '',
        institutionTIN: m.Tin || m.tin || m.tinno || m.tin || '',
        // Map backend INCORPD (legacy) to incorporation date if provided
        institutionIncoporationDate: m.INCORPD || m.INCORPD || m.IncorporationDate || m.incorporationDate || '',
        institutionDateJoined: m.DateJoin || m.datejoin || m.datejoin_raw || '',
        // Prefer numeric legacy fields nregion / ndist / nward
        institutionRegion: m.nregion ? String(m.nregion) : (m.Region ? String(m.Region) : (m.region ? String(m.region) : '')),
        institutionDistrict: m.ndist ? String(m.ndist) : (m.District ? String(m.District) : (m.district ? String(m.district) : '')),
        institutionWard: m.nward ? String(m.nward) : (m.Ward ? String(m.Ward) : (m.ward ? String(m.ward) : '')),
        institutionResidency: (m.Residents === true || m.Residents === 1) ? 'resident' : (m.residency || ''),
        // Common contact/address mappings
        // Ensure dropdown-friendly IDs for country and city are set when available
        country: m.cou_id ? Number(m.cou_id) : (m.Country || ''),
        city: (function () {
          const raw = m.ncity ?? m.City ?? m.city ?? '';
          const num = Number(raw);
          if (!Number.isNaN(num) && num > 0) {
            if (Array.isArray(cities) && cities.length > 0) return mapCityById(num);
            // mark pending so an effect can apply when cities load
            setPendingNcity(num);
            return String(num);
          }
          return mapCityById(raw) || (m.City ? String(m.City) : '');
        })(),
        address: m.cstreet || m.Street || m.caddr1 || m.caddr || m.address || '',
        mobilePhoneNumber: m.ctel || m.cmobile1 || m.cmobile || m.Tel || '',
        tel1: m.ctel1 || m.Tel1 || '',
        emailAddress: m.cemail || m.cemail1 || m.Email || m.Mail || '',
        // Primary referee / reference mapping (ref1)
        referenceDetailsName: m.ref1name || m.Ref1Name || m.ref1Name || '',
        referenceDetailsAddress: m.ref1addr || m.Ref1Addr || m.ref1Addr || m.ref1address || '',
        referenceDetailsMobilePhone: m.ref1tel || m.Ref1Tel || m.ref1tel || '',
        referenceDetailsEmailAddress: m.ref1mail || m.Ref1Mail || '',
        // Signatories and administrative fields
        signatory1: m.sign1 || m.cSignatory || m.Sign1 || m.signatory1 || '',
        signatory2: m.sign2 || m.Sign2 || '',
        signatory3: m.sign3 || m.Sign3 || m.signatory3 || '',
        signatory4: m.sign4 || m.Sign4 || '',
        defaultBatch: m.BatId || m.bat_id || m.defaultBatch || '',
        // Institution officer mappings (if present)
        chairName: m.chairname || m.ChairName || m.chairName || '',
        chairTIN: m.chairtin || m.ChairTin || m.chairTIN || '',
        chairMobilePhone: m.chairtel || m.ChairTel || m.chairMobilePhone || '',
        chairEmailAddress: m.chairmail || m.ChairMail || m.chairEmailAddress || '',
        chairAccountSignatory: !!(m.ChairSign || m.chairAccountSignatory),
        viceChairName: m.vcname || m.ViceName || m.viceChairName || '',
        viceChairTIN: m.vctin || m.ViceTin || m.viceChairTIN || '',
        viceChairMobilePhone: m.vctel || m.ViceTel || m.viceChairMobilePhone || '',
        viceChairEmailAddress: m.vcmail || m.ViceMail || m.viceChairEmailAddress || '',
        viceChairAccountSignatory: !!(m.ViceSign || m.vcsign || m.viceChairAccountSignatory),
        treasurerName: m.treaname || m.TreasurerName || m.treasurerName || '',
        treasurerTIN: m.treatin || m.TreasurerTin || m.treasurerTIN || '',
        treasurerMobilePhone: m.treatel || m.TreasurerTel || m.treasurerMobilePhone || '',
        treasurerEmailAddress: m.treamail || m.TreasurerMail || m.treasurerEmailAddress || '',
        treasurerAccountSignatory: !!(m.TreasurerSign || m.treasurerAccountSignatory),
        secretaryName: m.secname || m.SecName || m.secretaryName || '',
        secretaryTIN: m.sectin || m.SecTin || m.secretaryTIN || '',
        secretaryMobilePhone: m.sectel || m.SecTel || m.secretaryMobilePhone || '',
        secretaryEmailAddress: m.secmail || m.SecMail || m.secretaryEmailAddress || '',
        secretaryAccountSignatory: !!(m.SecSign || m.secretaryAccountSignatory),
        // Financial/membership defaults
        registrationFee: m.nRegFee || m.RegFee || 0,
        savingAmount: m.nSaveAmt || m.nSaveAmt || 0,
        savingMode: m.nSaveType ? 'fixed' : (m.nSaveType === false ? '' : (m.nSaveType || m.savingMode || '')),
        sharePrice: m.nSharePrice || m.nSharePrice || 0,
        sharesPurchase: m.nShares || m.nShares || 0,
      };

      // Sanitize any inline base64 images from the institution response so they don't appear as text
      if (isLikelyBase64Image(mappedInstitution.biometricPhotoName)) mappedInstitution.biometricPhotoName = 'server-photo.jpg';
      if (isLikelyBase64Image(mappedInstitution.biometricSignatureName)) mappedInstitution.biometricSignatureName = 'server-signature.png';

      // Trim all top-level string fields before setting form data
      const trimAllStringsLocal = (obj) => {
        const out = {};
        if (!obj || typeof obj !== 'object') return out;
        Object.keys(obj).forEach((k) => {
          const v = obj[k];
          out[k] = (typeof v === 'string') ? v.trim() : v;
        });
        return out;
      };

      setFormData((prev) => ({ ...prev, ...trimAllStringsLocal(mappedInstitution) }));
      // Populate additionalReferences from legacy ref1..ref4 fields when present
      try {
        const refs = [];
        for (let i = 1; i <= 4; i += 1) {
          const name = (m[`ref${i}name`] || m[`Ref${i}Name`] || m[`ref${i}Name`] || '').toString().trim();
          const address = (m[`ref${i}addr`] || m[`ref${i}address`] || m[`Ref${i}Addr`] || '').toString().trim();
          const email = (m[`ref${i}mail`] || m[`Ref${i}Mail`] || '').toString().trim();
          const phone = (m[`ref${i}tel`] || m[`Ref${i}Tel`] || '').toString().trim();
          if (name || address || email || phone) {
            refs.push({ id: Date.now() + i, name, address, mobilePhone: phone, emailAddress: email });
          }
        }
        if (refs.length > 0) setAdditionalReferences(refs);
      } catch {
        // ignore
      }

        // Populate Group Members if returned by backend (common legacy key: GroupMembers)
        try {
          const gmRaw = m.GroupMembers || m.groupMembers || m.GroupMember || m.groupMember || null;
          if (Array.isArray(gmRaw) && gmRaw.length > 0) {
            const mappedGm = gmRaw.map((g, idx) => ({
              id: Date.now() + idx,
              firstName: (g.MemFname || g.firstName || g.fname || '').toString().trim(),
              middleName: (g.MemMname || g.middleName || g.mname || '').toString().trim(),
              lastName: (g.MemLname || g.lastName || g.lname || '').toString().trim(),
              phoneNumber: (g.PhoneNumber || g.phone || g.tel || '').toString().trim(),
            }));
            if (mappedGm.length > 0) setGroupMembers(mappedGm);
          }
        } catch {
          // ignore
        }
      // If backend returned inline base64 images (or data URLs), convert and set previews
      try {
        const maybePhoto = m.memPict || m.MemberPicture || mappedInstitution.biometricPhotoName || '';
        const maybeSign = m.memsign || m.MemberSignature || mappedInstitution.biometricSignatureName || '';
        const photoUrl = toDataUrl(maybePhoto);
        const signUrl = toDataUrl(maybeSign);
        if (photoUrl) setPhotoPreviewUrl(photoUrl);
        if (signUrl) setSignaturePreviewUrl(signUrl);
      } catch {
        // ignore preview generation errors
      }
      setIsExistingMember(true);
      setStatusError(false);
      setStatusMessage('Institution data loaded. Edit fields as needed.');
    } catch (err) {
      setStatusError(true);
      setStatusMessage(err.message || 'Failed to load institution details');
    }
  };

  const clearInstitutionFields = () => {
    setInstitutionSearchCode('');
    setStatusMessage('');
    setIsExistingMember(false);
    setFormData((prev) => {
      const keysToReset = [
        'institutionType','institutionName','institutionNature','institutionMemberCode','institutionBranch','institutionIncoporationNumber','institutionTIN','institutionIncoporationDate','institutionDateJoined','institutionRegion','institutionDistrict','institutionWard','institutionResidency',
        'address','mobilePhoneNumber','tel1','emailAddress','signatory1','defaultBatch',
        'chairName','chairTIN','chairMobilePhone','chairEmailAddress','chairAccountSignatory',
        'viceChairName','viceChairTIN','viceChairMobilePhone','viceChairEmailAddress','viceChairAccountSignatory',
        'treasurerName','treasurerTIN','treasurerMobilePhone','treasurerEmailAddress','treasurerAccountSignatory',
        'secretaryName','secretaryTIN','secretaryMobilePhone','secretaryEmailAddress','secretaryAccountSignatory',
        'biometricPhotoName','biometricSignatureName','applicationFormName'
      ];
      const next = { ...prev };
      keysToReset.forEach((k) => {
        next[k] = initialForm[k] !== undefined ? initialForm[k] : '';
      });
      return next;
    });
    // Also clear any individual form fields when clearing institution search
    setTouched({});
    clearIndividualFields();
  };

  const clearIndividualFields = () => {
    setIndividualSearchCode('');
    setStatusMessage('');
    setIsExistingMember(false);
    setFormData((prev) => {
      const keysToReset = [
        'firstName','middleName','surname','memberCode','branch','institutionBranch','memberEmployed','sendSms','registerMobileWallet',
        'title','nationality','tribe','levelOfEducation','dateOfBirth','dateJoined','gender','maritalStatus','idType',
        'idNumber','placeIssue','dateIssued','expiryDate','povertyLevel','region','district','ward','country','city','address',
        'mobilePhoneNumber','emailAddress','refereeName','refereeAddress','refereeMobilePhone','refereeEmailAddress',
        'nextOfKinName','nextOfKinAddress','nextOfKinRelationship','nextOfKinMobilePhone','employer','employmentCountry',
        'employmentCity','employmentAddress','employmentMobilePhone','employmentEmailAddress','employmentNumber','designation',
        'department','yearsWithCurrentEmployment','currentSalary','biometricPhotoName','biometricSignatureName','applicationFormName','registrationFee',
        'contributionAccountNumber','contributionAccountName','sharePrice','sharesPurchase','shareValue','savingMode','savingAmount',
        'accountSignatory','deductedFromSourcePayroll','residency','referenceDetailsName','referenceDetailsAddress','referenceDetailsMobilePhone',
        'referenceDetailsEmailAddress','signatory1','signatory3','defaultBatch','printReceipt'
      ];
      const next = { ...prev };
      keysToReset.forEach((k) => {
        next[k] = initialForm[k] !== undefined ? initialForm[k] : '';
      });
      return next;
    });
    setTouched({});
    photoFileRef.current = null;
    signatureFileRef.current = null;
    applicationFormFileRef.current = null;
    setPhotoPreviewUrl('');
    setSignaturePreviewUrl('');
    setApplicationFormPreviewUrl('');
  };

// Helper to format row for DataGrid
function formatRecentMemberRow(row, institutionBranches = []) {
  if (!row) return {};
  // Helper to format date
  function formatDate(dateStr) {
    if (!dateStr || dateStr === '1900-01-01T00:00:00') return '';
    // Accept both string and Date
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  // Try all possible date fields for join and birth
  const dateJoinedRaw = row.dateJoined || row.date_joined || row.datejoin || row.ddatejoin;
  const dateOfBirthRaw = row.dateOfBirth || row.date_of_birth || row.ddatebirth || row.dob;

  // Branch: try string, fallback to branch id (number)
  let branchVal = row.branch || row.bracnh || row.branchid || row.branch_id || '';
  // If branchVal is a number and institutionBranches is available, map to branch name
  if (typeof branchVal === 'number' && Array.isArray(institutionBranches) && institutionBranches.length > 0) {
    // Assume branchVal is 1-based index or matches the order in institutionBranches
    // If your branch IDs map differently, adjust this logic accordingly
    if (branchVal > 0 && branchVal <= institutionBranches.length) {
      branchVal = institutionBranches[branchVal - 1] || branchVal.toString();
    } else {
      branchVal = branchVal.toString();
    }
  }
  if (typeof branchVal === 'number' && branchVal === 0) branchVal = '';

  return {
    memberCode:
      row.memberCode || row.clientCode || row.ccustcode || row.custcode || '',
    fullName:
      (row.firstName || row.ccustfname || '').trim() +
      ' ' +
      (row.surname || row.ccustlname || '').trim(),
    dateJoined: formatDate(dateJoinedRaw),
    dateOfBirth: formatDate(dateOfBirthRaw),
    branch: branchVal,
    id:
      row.memberCode || row.clientCode || row.ccustcode || row.custcode || Math.random(),
  };
}

  // Convert raw base64 (or data URL) into a safe data URL for <img src>
  const toDataUrl = (base64) => {
    if (!base64) return '';
    let s = String(base64).trim();
    if (!s) return '';
    if (s.startsWith('data:')) return s;
    // Strip any accidental data: prefix
    s = s.replace(/^data:.*;base64,/, '');
    const prefix = s.slice(0, 4);
    let mime = 'image/jpeg';
    if (prefix === 'iVBO' || prefix === 'iVBOR') mime = 'image/png';
    else if (prefix === '/9j/' || prefix === '/9j') mime = 'image/jpeg';
    else if (prefix === 'R0lG') mime = 'image/gif';
    return `data:${mime};base64,${s}`;
  };

  // Heuristic to detect inline base64 image payloads so we don't show them as "file names" in the UI
  const isLikelyBase64Image = (val) => {
    if (!val) return false;
    const s = String(val).trim();
    if (s.length < 30) return false;
    // JPEG, PNG, GIF signatures or long base64-like strings
    if (s.startsWith('/9j') || s.startsWith('iVBOR') || s.startsWith('R0lG')) return true;
    // If the string is long and contains only base64 chars (plus padding), treat it as base64
    const t = s.replace(/\s+/g, '');
    return t.length > 100 && /^[A-Za-z0-9+/=]+$/.test(t);
  };

  // Map backend idtype numeric codes to UI option values (we store numeric idtype strings)
  const mapIdTypeToOption = (val) => {
    if (val === undefined || val === null) return '';
    const n = Number(val);
    if (Number.isNaN(n) || n <= 0) return '';
    return String(n);
  };

  // Map UI option value back to numeric code
  const mapOptionToIdType = (val) => {
    const n = Number(val);
    if (!Number.isNaN(n) && n > 0) return n;
    return 0;
  };

  // Load id types for dropdown
  const { options: idTypeOptions, isLoading: idTypesLoading } = useIdTypes();

  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState('');
  const [applicationFormPreviewUrl, setApplicationFormPreviewUrl] = useState('');
  const [expandedImageUrl, setExpandedImageUrl] = useState('');
  const [expandedImageOpen, setExpandedImageOpen] = useState(false);
  const photoFileRef = useRef(null);
  const signatureFileRef = useRef(null);
  const applicationFormFileRef = useRef(null);
  const [additionalReferences, setAdditionalReferences] = useState([]);
  const [additionalNextOfKins, setAdditionalNextOfKins] = useState([]);
  const [trainings, setTrainings] = useState([
    {
      id: Date.now(),
      yearOfTraining: '',
      typeOfTraining: '',
      duration: '',
      supportedBy: '',
      numberOfBeneficiaries: '',
    },
  ]);
  const [projects, setProjects] = useState([
    {
      id: Date.now() + 1,
      year: '',
      projectType: '',
      status: '',
      supportedBy: '',
      remarks: '',
    },
  ]);
  const [committeeMembers, setCommitteeMembers] = useState([
    {
      id: Date.now() + 2,
      names: '',
      positions: '',
      literacyExperiences: '',
    },
  ]);
  const [bankingInformation, setBankingInformation] = useState([
    {
      id: Date.now() + 3,
      bank: '',
      accountNumber: '',
      currentBankBalance: '',
      addressOfBank: '',
    },
  ]);
  const [touched, setTouched] = useState({});
  const [pendingNcity, setPendingNcity] = useState(null);
  const [pendingBranchId, setPendingBranchId] = useState(null);
  const [pendingCouId, setPendingCouId] = useState(null);

  const [formData, setFormData] = useState(initialForm);

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const isFieldInvalid = (fieldName) => {
    if (!touched[fieldName]) return false;
    const value = formData[fieldName];
    if (typeof value === 'string') return !value.trim();
    return !value;
  };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[0-9+()\-\s]{7,15}$/;

  // Email is optional on most cards, so only flag it once touched and non-empty with a bad format.
  const getEmailFormatError = (fieldName) => {
    if (!touched[fieldName]) return '';
    const value = formData[fieldName];
    if (!value || !String(value).trim()) return '';
    return EMAIL_REGEX.test(String(value).trim()) ? '' : 'Enter a valid email address';
  };

  // Phone fields here are required, so combine the required check with a format check.
  const getPhoneError = (fieldName, label) => {
    if (!touched[fieldName]) return '';
    const value = formData[fieldName] ? String(formData[fieldName]).trim() : '';
    if (!value) return `${label} is required`;
    return PHONE_REGEX.test(value) ? '' : 'Enter a valid phone number';
  };

  const getDateOfBirthError = () => {
    if (!touched.dateOfBirth) return '';
    if (!formData.dateOfBirth) return 'Date of Birth is required';
    const age = dayjs().diff(dayjs(formData.dateOfBirth), 'year');
    return age >= 18 ? '' : 'Customer must be at least 18 years old';
  };

  const getExpiryDateError = () => {
    if (!touched.expiryDate) return '';
    if (!formData.expiryDate) return 'Expiry Date is required';
    if (formData.dateIssued && dayjs(formData.expiryDate).isBefore(dayjs(formData.dateIssued))) {
      return 'Expiry Date must be after Date Issued';
    }
    return '';
  };

  // Shared validation used by both the initial Save flow and the Update flows (edit-existing-member)
  // so required-field checks, format checks, and the tab-auto-switch/scroll-to-field behavior stay
  // consistent no matter which action the user takes.
  const runFormValidation = (targetMainTab) => {
    const missingFields = [];
    const invalidMessages = [];
    let firstErrorTab = null;
    let firstErrorField = null;
    const touchedFields = {};
    const noteError = (field, tab) => {
      if (firstErrorTab === null && tab !== null && tab !== undefined) firstErrorTab = tab;
      if (firstErrorField === null && field) firstErrorField = field;
    };

    if (targetMainTab === 0) {
      const requiredChecks = [
        ['firstName', 'First Name', null],
        ['surname', 'Surname', null],
        ['institutionBranch', 'Branch', null],
        ['city', 'City', 1],
        ['address', 'Address', 1],
        ['region', 'Region', 0],
        ['district', 'District', 0],
        ['ward', 'Ward', 0],
        ['title', 'Title', 0],
        ['gender', 'Gender', 0],
        ['nationality', 'Nationality', 0],
        ['maritalStatus', 'Marital status', 0],
        ['dateOfBirth', 'Date of Birth', 0],
        ['dateJoined', 'Date Joined', 0],
        ['idType', 'ID Type', 0],
        ['idNumber', 'ID number', 0],
        ['placeIssue', 'Place Issued', 0],
        ['dateIssued', 'Date Issued', 0],
        ['expiryDate', 'Expiry Date', 0],
        ['country', 'Country of Residence', 1],
        ['mobilePhoneNumber', 'Mobile Phone number', 1],
        ['nextOfKinName', 'Next of Kin Name', 1],
        ['signatory1', 'Signatory 1', 3],
      ];
      requiredChecks.forEach(([name, label, tab]) => {
        touchedFields[name] = true;
        if (!formData[name]) {
          missingFields.push(label);
          noteError(name, tab);
        }
      });
      touchedFields.emailAddress = true;

      if (formData.dateOfBirth && dayjs().diff(dayjs(formData.dateOfBirth), 'year') < 18) {
        invalidMessages.push('Date of Birth (must be 18 or older)');
        noteError('dateOfBirth', 0);
      }
      if (formData.expiryDate && formData.dateIssued && dayjs(formData.expiryDate).isBefore(dayjs(formData.dateIssued))) {
        invalidMessages.push('Expiry Date (must be after Date Issued)');
        noteError('expiryDate', 0);
      }
      if (formData.mobilePhoneNumber && !PHONE_REGEX.test(String(formData.mobilePhoneNumber).trim())) {
        invalidMessages.push('Mobile Phone number (invalid format)');
        noteError('mobilePhoneNumber', 1);
      }
      if (formData.emailAddress && !EMAIL_REGEX.test(String(formData.emailAddress).trim())) {
        invalidMessages.push('Email address (invalid format)');
        noteError('emailAddress', 1);
      }
    } else {
      const requiredChecks = [
        ['institutionType', 'Institution Type', null],
        ['institutionName', 'Institution Name', null],
        ['institutionNature', 'Business Category', null],
        ['country', 'Country', 0],
        ['city', 'City', 0],
        ['district', 'District', 0],
        ['address', 'Street', 0],
        ['mobilePhoneNumber', 'Tel', 0],
        ['institutionIncoporationNumber', 'Incoporation Number', 0],
        ['institutionTIN', 'TIN', 0],
        ['institutionIncoporationDate', 'Incoporation date', 0],
        ['institutionDateJoined', 'Date joined', 0],
        ['institutionRegion', 'Region', 0],
        ['institutionDistrict', 'Institution District', 0],
        ['institutionWard', 'Ward', 0],
        ['chairName', 'Chair Name', 1],
        ['chairDOB', 'Chair Date of Birth', 1],
        ['chairMobilePhone', 'Chair Mobile Phone', 1],
        ['signatory1', 'Signatory 1', 1],
      ];
      requiredChecks.forEach(([name, label, tab]) => {
        touchedFields[name] = true;
        if (!formData[name]) {
          missingFields.push(label);
          noteError(name, tab);
        }
      });
      touchedFields.emailAddress = true;
      touchedFields.chairEmailAddress = true;

      if (formData.mobilePhoneNumber && !PHONE_REGEX.test(String(formData.mobilePhoneNumber).trim())) {
        invalidMessages.push('Tel (invalid format)');
        noteError('mobilePhoneNumber', 0);
      }
      if (formData.chairMobilePhone && !PHONE_REGEX.test(String(formData.chairMobilePhone).trim())) {
        invalidMessages.push('Chair Mobile Phone (invalid format)');
        noteError('chairMobilePhone', 1);
      }
      if (formData.emailAddress && !EMAIL_REGEX.test(String(formData.emailAddress).trim())) {
        invalidMessages.push('Email (invalid format)');
        noteError('emailAddress', 0);
      }
      if (formData.chairEmailAddress && !EMAIL_REGEX.test(String(formData.chairEmailAddress).trim())) {
        invalidMessages.push('Chair Email Address (invalid format)');
        noteError('chairEmailAddress', 1);
      }
    }

    return { missingFields, invalidMessages, firstErrorTab, firstErrorField, touchedFields };
  };

  // Scroll the first invalid/missing field into view once the tab holding it becomes active.
  const scrollToField = (fieldName) => {
    if (!fieldName || typeof document === 'undefined') return;
    setTimeout(() => {
      const el = document.querySelector(`[name="${fieldName}"]`);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof el.focus === 'function') el.focus({ preventScroll: true });
      }
    }, 120);
  };

  // If a legacy numeric `ncity` was provided before `cities` loaded, apply it
  // as a 1-based index into the `cities` array once cities are available.
  useEffect(() => {
    if (!pendingNcity) return;
    if (!Array.isArray(cities) || cities.length === 0) return;
    const idx = Number(pendingNcity);
    if (Number.isNaN(idx) || idx <= 0) {
      setPendingNcity(null);
      return;
    }
    const cityObj = cities[idx - 1];
    if (cityObj && (cityObj.name || cityObj.name === '')) {
      setFormData((prev) => ({ ...prev, city: String(cityObj.name) }));
    }
    setPendingNcity(null);
  }, [cities, pendingNcity]);

  useEffect(() => {
    if (!pendingBranchId) return;
    if (!Array.isArray(institutionBranches) || institutionBranches.length === 0) return;
    const idx = Number(pendingBranchId);
    if (Number.isNaN(idx) || idx <= 0) {
      setPendingBranchId(null);
      return;
    }
    const branchName = institutionBranches[idx - 1];
    if (branchName) {
      setFormData((prev) => ({ ...prev, institutionBranch: branchName }));
    }
    setPendingBranchId(null);
  }, [institutionBranches, pendingBranchId]);

  useEffect(() => {
    if (!pendingCouId) return;
    if (!Array.isArray(countries) || countries.length === 0) return;
    const idx = Number(pendingCouId);
    if (Number.isNaN(idx) || idx <= 0) {
      setPendingCouId(null);
      return;
    }
    const countryObj = countries[idx - 1];
    if (countryObj && countryObj.name) {
      setFormData((prev) => ({ ...prev, nationality: String(countryObj.name) }));
    }
    setPendingCouId(null);
  }, [countries, pendingCouId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setStatusMessage('');
    setStatusError(false);
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDateChange = (name, value) => {
    setStatusMessage('');
    setStatusError(false);
    setFormData((prev) => ({
      ...prev,
      [name]: value ? value.format('YYYY-MM-DD') : '',
    }));
  };

  const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  const UPLOAD_FIELD_LABELS = {
    biometricPhotoName: 'Photo',
    biometricSignatureName: 'Signature',
    applicationFormName: 'Application Form',
  };

  const handleBiometricFileChange = (fieldName, event) => {
    const selectedFile = event.target.files?.[0] || null;
    setStatusMessage('');
    setStatusError(false);

    if (selectedFile) {
      const label = UPLOAD_FIELD_LABELS[fieldName] || 'File';
      if (!selectedFile.type.startsWith('image/')) {
        setStatusError(true);
        setStatusMessage(`${label} must be an image file (JPG, PNG, etc.).`);
        event.target.value = '';
        return;
      }
      if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
        setStatusError(true);
        setStatusMessage(`${label} must be smaller than 5 MB.`);
        event.target.value = '';
        return;
      }
    }

    if (fieldName === 'biometricPhotoName') {
      photoFileRef.current = selectedFile;
      setPhotoPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return selectedFile ? URL.createObjectURL(selectedFile) : '';
      });
    }

    if (fieldName === 'biometricSignatureName') {
      signatureFileRef.current = selectedFile;
      setSignaturePreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return selectedFile ? URL.createObjectURL(selectedFile) : '';
      });
    }

    if (fieldName === 'applicationFormName') {
      applicationFormFileRef.current = selectedFile;
      setApplicationFormPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return selectedFile ? URL.createObjectURL(selectedFile) : '';
      });
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: selectedFile ? selectedFile.name : '',
    }));
  };

  const handleRemoveBiometricFile = (fieldName) => {
    setStatusMessage('');
    setStatusError(false);

    if (fieldName === 'biometricPhotoName') {
      photoFileRef.current = null;
      setPhotoPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return '';
      });
    }

    if (fieldName === 'biometricSignatureName') {
      signatureFileRef.current = null;
      setSignaturePreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return '';
      });
    }

    if (fieldName === 'applicationFormName') {
      applicationFormFileRef.current = null;
      setApplicationFormPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return '';
      });
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: '',
    }));
  };

  const handleAddReferenceCard = () => {
    setAdditionalReferences((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        address: '',
        mobilePhone: '',
        emailAddress: '',
      },
    ]);
  };

  const handleAdditionalReferenceChange = (id, field, value) => {
    setAdditionalReferences((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleAddTrainingCard = () => {
    setTrainings((prev) => [
      ...prev,
      {
        id: Date.now(),
        yearOfTraining: '',
        typeOfTraining: '',
        duration: '',
        supportedBy: '',
        numberOfBeneficiaries: '',
      },
    ]);
  };

  const handleTrainingChange = (id, field, value) => {
    setTrainings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleDeleteTraining = (id) => {
    setTrainings((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddProjectCard = () => {
    setProjects((prev) => [
      ...prev,
      {
        id: Date.now(),
        year: '',
        projectType: '',
        status: '',
        supportedBy: '',
        remarks: '',
      },
    ]);
  };

  const handleProjectChange = (id, field, value) => {
    setProjects((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleDeleteProject = (id) => {
    setProjects((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddCommitteeMemberCard = () => {
    setCommitteeMembers((prev) => [
      ...prev,
      {
        id: Date.now(),
        names: '',
        positions: '',
        literacyExperiences: '',
      },
    ]);
  };

  const handleCommitteeMemberChange = (id, field, value) => {
    setCommitteeMembers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleDeleteCommitteeMember = (id) => {
    setCommitteeMembers((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddBankingInformationCard = () => {
    setBankingInformation((prev) => [
      ...prev,
      {
        id: Date.now(),
        bank: '',
        accountNumber: '',
        currentBankBalance: '',
        addressOfBank: '',
      },
    ]);
  };

  const handleBankingInformationChange = (id, field, value) => {
    setBankingInformation((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleDeleteBankingInformation = (id) => {
    setBankingInformation((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddNextOfKinCard = () => {
    setAdditionalNextOfKins((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        address: '',
        relationship: '',
        mobilePhone: '',
      },
    ]);
  };

  const handleAdditionalNextOfKinChange = (id, field, value) => {
    setAdditionalNextOfKins((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  // Fetch banks data
  const { banks, loading: banksLoading } = useBanks();

  // Reset helpers, used both by direct "start new registration" actions and by the
  // post-save confirmation dialog, so the reset logic lives in exactly one place.
  const resetIndividualForm = () => {
    setFormData(initialForm);
    setAdditionalReferences([]);
    setAdditionalNextOfKins([]);
    setGroupMembers([
      {
        id: Date.now() + Math.random(),
        firstName: '',
        lastName: '',
        phoneNumber: '',
        dateOfBirth: '',
      },
    ]);
    photoFileRef.current = null;
    signatureFileRef.current = null;
    applicationFormFileRef.current = null;
    setPhotoPreviewUrl('');
    setSignaturePreviewUrl('');
    setApplicationFormPreviewUrl('');
    setTouched({});
  };

  const resetInstitutionForm = () => {
    setFormData(initialForm);
    setAdditionalReferences([]);
    setAdditionalNextOfKins([]);
    setTrainings([
      {
        id: Date.now(),
        yearOfTraining: '',
        typeOfTraining: '',
        duration: '',
        supportedBy: '',
        numberOfBeneficiaries: '',
      },
    ]);
    setProjects([
      {
        id: Date.now() + 1,
        year: '',
        projectType: '',
        status: '',
        supportedBy: '',
        remarks: '',
      },
    ]);
    setCommitteeMembers([
      {
        id: Date.now() + 2,
        names: '',
        positions: '',
        literacyExperiences: '',
      },
    ]);
    setBankingInformation([
      {
        id: Date.now() + 3,
        bank: '',
        accountNumber: '',
        currentBankBalance: '',
        addressOfBank: '',
      },
    ]);
    setGroupMembers([
      {
        id: Date.now() + Math.random(),
        firstName: '',
        lastName: '',
        phoneNumber: '',
        dateOfBirth: '',
      },
    ]);
    photoFileRef.current = null;
    signatureFileRef.current = null;
    applicationFormFileRef.current = null;
    setPhotoPreviewUrl('');
    setSignaturePreviewUrl('');
    setApplicationFormPreviewUrl('');
    setTouched({});
  };

  const handleSave = async () => {
    const formSubmitStartTime = performance.now();
    
    // Emit metric for form submission attempt
    Sentry.metrics.count('registration_form_submit', 1);

    if (isReadOnlyRole || isSaving) {
      return;
    }

    setSaveValidationErrors(null);

    const { missingFields, invalidMessages, firstErrorTab, firstErrorField, touchedFields } = runFormValidation(mainTab);

    if (missingFields.length > 0 || invalidMessages.length > 0) {
      // Touch all relevant fields for the current tab so red borders/helper text appear
      setTouched(touchedFields);

      // Jump to the tab containing the first offending field so its red border is visible
      if (firstErrorTab !== null && detailTab !== firstErrorTab) {
        setDetailTab(firstErrorTab);
      }

      setSaveValidationErrors({ missingFields, invalidMessages });
      setStatusMessage('');
      setStatusError(true);
      scrollToField(firstErrorField);
      return;
    }

    // Convert uploaded images to base64
    const fileToBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const pictureBase64 = photoFileRef.current ? await fileToBase64(photoFileRef.current) : null;
    const signatureBase64 = signatureFileRef.current ? await fileToBase64(signatureFileRef.current) : null;
    const applicationFormBase64 = applicationFormFileRef.current ? await fileToBase64(applicationFormFileRef.current) : null;

    setIsSaving(true);
    setFieldErrors({});
    setStatusMessage('');
    setStatusError(false);

    if (mainTab === 0) {
      // Individual tab: map fields to backend payload and call useRegisterIndividual
      const user = useAuthStore.getState().user;
      const individualPayload = buildIndividualPayload(formData, countries, cities, {
        compId: user?.CompId,
        branchId: user?.BranchId,
        username: user?.username,
      });
      individualPayload.MemberPicture = pictureBase64;
      individualPayload.MemberSignature = signatureBase64;
      individualPayload.ApplicationForm = applicationFormBase64;
      try {
        const result = await registerIndividual(individualPayload);
        setStatusMessage('Individual registration saved successfully.');
        notifySaveSuccess({
          page: 'Customer Administration / Registration',
          action: 'Save Individual Registration',
          message: 'Individual registration saved successfully.',
          metadata: individualPayload,
        });

        // Emit metrics for successful individual registration
        const registrationDuration = performance.now() - formSubmitStartTime;
        Sentry.metrics.count('registration_success', 1);
        Sentry.metrics.count('individual_registration_success', 1);
        Sentry.metrics.distribution('registration_duration_ms', registrationDuration);

        // Set recent member data for printing
        if (result) {
          const memberData = formatRecentMemberRow(result, institutionBranches);
          setRecentMember({ ...result, ...memberData });
        }

        // Trigger print if checkbox is checked
        if (formData.printReceipt) {
          setTimeout(() => {
            handlePrintReceipt();
          }, 500);
        }

        setPendingFormReset('individual');
      } catch (error) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Unable to save individual registration.';
        setStatusMessage(errorMessage);
        setStatusError(true);
        notifySaveError({
          page: 'Customer Administration / Registration',
          action: 'Save Individual Registration',
          message: errorMessage,
          error,
          metadata: individualPayload,
        });

        // Emit metrics for individual registration failure
        Sentry.metrics.count('registration_failure', 1);
        Sentry.metrics.count('individual_registration_failure', 1);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Institution tab: map fields to backend payload and call useRegisterInstitution
      const user = useAuthStore.getState().user;
      const companyId = user?.CompId;
      const institutionPayload = buildInstitutionPayload(
        {
          ...formData,
          trainings,
          projects,
          committeeMembers,
          bankingInformation,
        },
        cities,
        {
          compId: companyId,
          branchId: user?.BranchId,
          username: user?.username,
        }
      );
      institutionPayload.MemberPicture = pictureBase64;
      institutionPayload.MemberSignature = signatureBase64;
      // Add GroupMembers array to payload
      institutionPayload.GroupMembers = groupMembers.map(member => ({
        MemFname: member.firstName,
        MemLname: member.lastName,
        PhoneNumber: member.phoneNumber,
        dob: member.dateOfBirth,
        CreationDate: dayjs().format('YYYY-MM-DD'),
        compid: companyId,
      }));
      try {
        const response = await registerInstitution(institutionPayload);
        // If backend returns companyId, set it in formData
        if (response && response.companyId) {
          setFormData((prev) => ({ ...prev, companyId: response.companyId }));
        }
        setStatusMessage('Institution registration saved successfully.');
        setTimeout(() => {
          setStatusMessage((msg) => (msg === 'Institution registration saved successfully.' ? '' : msg));
        }, 5000);
        notifySaveSuccess({
          page: 'Customer Administration / Registration',
          action: 'Save Institution Registration',
          message: 'Institution registration saved successfully.',
          metadata: institutionPayload,
        });

        // Emit metrics for successful institution registration
        const registrationDuration = performance.now() - formSubmitStartTime;
        Sentry.metrics.count('registration_success', 1);
        Sentry.metrics.count('institution_registration_success', 1);
        Sentry.metrics.distribution('registration_duration_ms', registrationDuration);

        // Set recent member data for printing
        if (response) {
          const memberData = formatRecentMemberRow(response, institutionBranches);
          setRecentMember({ ...response, ...memberData });
        }

        // Trigger print if checkbox is checked
        if (formData.printReceipt) {
          setTimeout(() => {
            handlePrintReceipt();
          }, 500);
        }

        setPendingFormReset('institution');
      } catch (error) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Unable to save customer registration.';
        setStatusMessage(errorMessage);
        setStatusError(true);
        notifySaveError({
          page: 'Customer Administration / Registration',
          action: 'Save Customer Registration',
          message: errorMessage,
          error,
          metadata: institutionPayload,
        });

        // Emit metrics for institution registration failure
        Sentry.metrics.count('registration_failure', 1);
        Sentry.metrics.count('institution_registration_failure', 1);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleUpdateCustomer = async () => {
    if (!isExistingMember || isSaving) return;

    setSaveValidationErrors(null);
    const { missingFields, invalidMessages, firstErrorTab, firstErrorField, touchedFields } = runFormValidation(0);
    if (missingFields.length > 0 || invalidMessages.length > 0) {
      setTouched(touchedFields);
      if (firstErrorTab !== null && detailTab !== firstErrorTab) {
        setDetailTab(firstErrorTab);
      }
      setSaveValidationErrors({ missingFields, invalidMessages });
      setStatusMessage('');
      setStatusError(true);
      scrollToField(firstErrorField);
      return;
    }

    // Similar to save: validate minimal fields then build payload and POST to update endpoint
    setIsSaving(true);
    setFieldErrors({});
    setStatusMessage('');
    setStatusError(false);

    // Convert uploaded images to base64
    const fileToBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const pictureBase64 = photoFileRef.current ? await fileToBase64(photoFileRef.current) : null;
    const signatureBase64 = signatureFileRef.current ? await fileToBase64(signatureFileRef.current) : null;
    const applicationFormBase64 = applicationFormFileRef.current ? await fileToBase64(applicationFormFileRef.current) : null;

    try {
      const user = useAuthStore.getState().user;
      const payload = mainTab === 0
        ? buildIndividualPayload(formData, countries, cities, { compId: user?.CompId, branchId: user?.BranchId, username: user?.username })
        : buildInstitutionPayload(
            {
              ...formData,
              trainings,
              projects,
              committeeMembers,
              bankingInformation,
            },
            cities,
            { compId: user?.CompId, branchId: user?.BranchId, username: user?.username }
          );

      payload.MemberPicture = pictureBase64;
      payload.MemberSignature = signatureBase64;
      payload.ApplicationForm = applicationFormBase64;
      // Add EditedBy: current user
      payload.EditedBy = useAuthStore.getState().user?.username || (typeof document !== 'undefined' ? (document.cookie.split('; ').find(c=>c.startsWith('user=')) ? JSON.parse(decodeURIComponent(document.cookie.split('; ').find(c=>c.startsWith('user=')).split('=')[1])).username : '') : '');

      // Transform payload to backend expected shape
      const toBool = (v) => (v === true || v === 'true' || v === 1 || v === '1');
      const ensureDateTime = (d) => {
        if (!d) return '';
        if (String(d).includes('T')) return d;
        return `${d}T00:00:00`;
      };

      const updatePayload = {
        ccustcode: formData.memberCode || payload.memberCode || '',
        ccustfname: formData.firstName || payload.FName || '',
        ccustmname: formData.middleName || payload.MName || '',
        ccustlname: formData.surname || payload.LName || '',

        employed: !!payload.Employed,

        ccusttitle: Number(payload.Title) || 0,
        natcode: Number(payload.NatCode) || (formData.country || 0),

        ddatebirth: ensureDateTime(payload.DOB || formData.dateOfBirth),
        datejoin: ensureDateTime(payload.DateJoin || formData.dateJoined),

        gender: toBool(formData.gender) || toBool(payload.gender),
        marital: Number(payload.Marital) || Number(formData.maritalStatus) || 0,

        // Convert UI `idType` (e.g. 'national-id') back to numeric code expected by backend
        idtype: mapOptionToIdType(payload.IDType ?? formData.idType),
        cpassno: payload.IDNumber || formData.idNumber || '',
        cplacissue: payload.PlaceIssued || formData.placeIssue || '',

        ddateissue: ensureDateTime(payload.DateIssue || formData.dateIssued),
        ddateexpire: ensureDateTime(payload.DateExpire || formData.expiryDate),

        nregion: Number(payload.Region) || Number(formData.region) || 0,
        ndist: Number(payload.District) || Number(formData.district) || 0,
        nward: Number(payload.Ward) || Number(formData.ward) || 0,

        residents: !!payload.Residents,
        cust_type: payload.CustType || 'C',

        cou_id: Number(formData.country) || Number(payload.Country) || 0,
        ncity: Number(payload.City) || 0,

        cstreet: payload.Street || formData.address || '',
        ctel: payload.Tel || formData.mobilePhoneNumber || '',
        ctel1: payload.Tel1 || formData.tel1 || '',
        cemail: payload.Email || formData.emailAddress || '',

        cname1: formData.refereeName || payload.RefName || '',
        caddr1: formData.refereeAddress || payload.RefAddress || '',
        cMobile1: formData.refereeMobilePhone || payload.RefMobile || '',
        cEmail1: formData.refereeEmailAddress || payload.RefEmail || '',

        cName2: formData.nextOfKinName || '',
        cAddr2: formData.nextOfKinAddress || '',
        nRel: formData.nextOfKinRelationship || '',
        cMobile2: formData.nextOfKinMobilePhone || '',

        nEmployer: Number(formData.employer) || Number(payload.Employer) || 0,
        cstaffno: formData.employmentNumber || payload.StaffNo || '',

        nDesig: Number(formData.designation) || 0,
        nDept: Number(formData.department) || 0,

        nYears: Number(formData.yearsWithCurrentEmployment) || 0,
        nSal: Number(formData.currentSalary) || 0,

        nRegFee: Number(payload.RegFee) || Number(formData.registrationFee) || 0,
        nSharePrice: Number(payload.SharePrice) || Number(formData.sharePrice) || 0,

        nShares: Number(payload.Shares) || Number(formData.sharesPurchase) || 0,

        nSaveAmt: Number(payload.SaveAmount) || Number(formData.savingAmount) || 0,
        nSaveType: !!payload.SaveType,

        cSignatory: payload.Signatory || formData.signatory1 || '',

        modepay: !!formData.deductedFromSourcePayroll,

        branch_id: Number(formData.institutionBranch) || useAuthStore.getState().user?.BranchId || 0,
        bat_id: Number(payload.BatId) || 0,

        memPict: pictureBase64 || null,
        memsign: signatureBase64 || null,
        applicationForm: applicationFormBase64 || payload.ApplicationForm || '',

        levelofedu: Number(formData.levelOfEducation) || 0,
        tribe: Number(formData.tribe) || 0,
        povertylevel: Number(formData.povertyLevel) || 0,

        EditedBy: payload.EditedBy || (useAuthStore.getState().user?.username || ''),
      };

      const url = getFullApiUrl('/api/UpdateMemberDeatails/update');
      // Log payload for debugging (inspect in browser console / server logs)

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      // Capture response text for better error reporting and debugging
      const resText = await res.text().catch(() => '');

      if (!res.ok) {
        let parsed = {};
        try {
          parsed = JSON.parse(resText || '{}');
        } catch {
          // ignore parse error
        }
        throw new Error(parsed.message || `Update failed (${res.status}) - ${resText}`);
      }

      let result = {};
      try {
        result = JSON.parse(resText || '{}');
      } catch {
        result = {};
      }

      setStatusMessage('Customer updated successfully.');
      setStatusError(false);
      notifySaveSuccess({ page: 'Customer Administration / Registration', action: 'Update Customer', message: 'Customer updated successfully.', metadata: updatePayload });

      // Update recent member data for printing if available
      if (result) {
        const memberData = formatRecentMemberRow(result, institutionBranches);
        setRecentMember({ ...result, ...memberData });
      }

    } catch (err) {
      setStatusMessage(err.message || 'Failed to update customer');
      setStatusError(true);
      notifySaveError({ page: 'Customer Administration / Registration', action: 'Update Customer', message: 'Failed to update customer', error: err, metadata: null });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateInstitution = async () => {
    if (!isExistingMember || isSaving) return;

    setSaveValidationErrors(null);
    const { missingFields, invalidMessages, firstErrorTab, firstErrorField, touchedFields } = runFormValidation(1);
    if (missingFields.length > 0 || invalidMessages.length > 0) {
      setTouched(touchedFields);
      if (firstErrorTab !== null && detailTab !== firstErrorTab) {
        setDetailTab(firstErrorTab);
      }
      setSaveValidationErrors({ missingFields, invalidMessages });
      setStatusMessage('');
      setStatusError(true);
      scrollToField(firstErrorField);
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    setStatusMessage('');
    setStatusError(false);

    // Convert uploaded images to base64
    const fileToBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const pictureBase64 = photoFileRef.current ? await fileToBase64(photoFileRef.current) : null;
    const signatureBase64 = signatureFileRef.current ? await fileToBase64(signatureFileRef.current) : null;
    const applicationFormBase64 = applicationFormFileRef.current ? await fileToBase64(applicationFormFileRef.current) : null;

    try {
      const user = useAuthStore.getState().user;
      const payload = buildInstitutionPayload(formData, cities, { compId: user?.CompId, branchId: user?.BranchId, username: user?.username });
      payload.MemberPicture = pictureBase64;
      payload.MemberSignature = signatureBase64;
      payload.ApplicationForm = applicationFormBase64;
      payload.EditedBy = useAuthStore.getState().user?.username || '';
      // Populate additional references (Ref2..Ref4) from `additionalReferences` state
      try {
        if (Array.isArray(additionalReferences) && additionalReferences.length > 0) {
          // Ref1 is already set from form field; fill subsequent refs from the array
          const refs = additionalReferences.slice(0, 4);
          // Ensure each ref maps to expected backend keys
          refs.forEach((r, idx) => {
            const i = idx + 1; // 1-based
            payload[`Ref${i}Name`] = r.name || payload[`Ref${i}Name`] || '';
            payload[`Ref${i}Address`] = r.address || r.address || payload[`Ref${i}Address`] || '';
            payload[`Ref${i}Tel`] = r.mobilePhone || r.mobilePhone || payload[`Ref${i}Tel`] || '';
            payload[`Ref${i}Mail`] = r.emailAddress || r.emailAddress || payload[`Ref${i}Mail`] || '';
          });
        }
      } catch {
        // ignore
      }
      // Batch ID and MemType mapping from form fields when available
      try {
        payload.BatId = Number(formData.defaultBatch) || Number(payload.BatId) || 0;
      } catch {
        payload.BatId = Number(payload.BatId) || 0;
      }
      // MemType may be provided as a numeric selection; default to 0 if not set
      payload.MemType = Number(formData.memType) || Number(payload.MemType) || 0;

      // Ensure MemCode is present (institution code / ccustcode)
      try {
        payload.MemCode = String(formData.institutionMemberCode || payload.MemCode || '').trim();
      } catch {
        payload.MemCode = payload.MemCode || '';
      }

      // Build API-compatible update payload (backend expects specific field names)
      const ensureDateOnly = (d) => {
        if (!d) return '';
        const s = String(d);
        return s.includes('T') ? s.split('T')[0] : s;
      };

      const updatePayload = {
        MemCode: String(payload.MemCode || formData.institutionMemberCode || '').trim(),
        CustName: payload.CustName || formData.institutionName || '',
        BizCat: Number(payload.BizCategory || payload.BizCat || Number(formData.institutionNature) || 0) || 0,

        CountryId: Number(payload.Country || payload.CountryId || 0) || 0,
        CityId: Number(payload.City || payload.CityId || 0) || 0,
        Street: payload.Street || formData.address || '',
        Tel: payload.Tel || formData.mobilePhoneNumber || '',
        Tel1: payload.Tel1 || formData.tel1 || '',
        Email: payload.Email || formData.emailAddress || '',

        IncorporationNo: payload.IncorporationNo || formData.institutionIncoporationNumber || '',
        TIN: payload.Tin || formData.institutionTIN || '',
        IncorporationDate: ensureDateOnly(payload.IncorporationDate || payload.institutionIncoporationDate || ''),
        DateJoin: ensureDateOnly(payload.DateJoin || payload.institutionDateJoined || ''),

        Region: Number(payload.Region || payload.institutionRegion) || 0,
        District: Number(payload.District || payload.institutionDistrict) || 0,
        Ward: Number(payload.Ward || payload.institutionWard) || 0,
        Resident: !!(payload.Residents || payload.Resident),
        CustomerType: payload.CustType || payload.CustomerType || 'C',

        ChairName: payload.ChairName || payload.chairName || formData.chairName || '',
        ChairTin: payload.ChairTin || payload.chairTIN || formData.chairTIN || '',
        ChairTel: payload.ChairTel || payload.chairMobilePhone || formData.chairMobilePhone || '',
        ChairMail: payload.ChairMail || payload.chairEmailAddress || formData.chairEmailAddress || '',
        ChairSign: !!(payload.ChairSign || payload.chairAccountSignatory || formData.chairAccountSignatory),

        VCName: payload.ViceName || payload.vcname || formData.viceChairName || '',
        VCTin: payload.ViceTin || payload.vctin || formData.viceChairTIN || '',
        VCTel: payload.ViceTel || payload.vctel || formData.viceChairMobilePhone || '',
        VCMail: payload.ViceMail || payload.vcMail || formData.viceChairEmailAddress || '',
        VCSign: !!(payload.ViceSign || payload.vcsign || formData.viceChairAccountSignatory),

        TreaName: payload.TreasurerName || payload.treaname || formData.treasurerName || '',
        TreaTin: payload.TreasurerTin || payload.treatin || formData.treasurerTIN || '',
        TreaTel: payload.TreasurerTel || payload.treatel || formData.treasurerMobilePhone || '',
        TreaMail: payload.TreasurerMail || payload.treamail || formData.treasurerEmailAddress || '',
        TreaSign: !!(payload.TreasurerSign || payload.treaSign || formData.treasurerAccountSignatory),

        SecName: payload.SecName || payload.secname || formData.secretaryName || '',
        SecTin: payload.SecTin || payload.sectin || formData.secretaryTIN || '',
        SecTel: payload.SecTel || payload.sectel || formData.secretaryMobilePhone || '',
        SecMail: payload.SecMail || payload.secmail || formData.secretaryEmailAddress || '',
        SecSign: !!(payload.SecSign || payload.secSign || formData.secretaryAccountSignatory),

        Ref1Name: payload.Ref1Name || formData.referenceDetailsName || '',
        Ref1Addr: payload.Ref1Address || formData.referenceDetailsAddress || '',
        Ref1Tel: payload.Ref1Tel || formData.referenceDetailsMobilePhone || '',
        Ref1Mail: payload.Ref1Mail || formData.referenceDetailsEmailAddress || '',

        Ref2Name: payload.Ref2Name || '',
        Ref2Addr: payload.Ref2Address || '',
        Ref2Tel: payload.Ref2Tel || '',
        Ref2Mail: payload.Ref2Mail || '',

        Ref3Name: payload.Ref3Name || '',
        Ref3Addr: payload.Ref3Address || '',
        Ref3Tel: payload.Ref3Tel || '',
        Ref3Mail: payload.Ref3Mail || '',

        Ref4Name: payload.Ref4Name || '',
        Ref4Addr: payload.Ref4Address || '',
        Ref4Tel: payload.Ref4Tel || '',
        Ref4Mail: payload.Ref4Mail || '',

        RegFee: Number(payload.RegFee || payload.nRegFee || 0) || 0,
        SharePrice: Number(payload.SharePrice || payload.nSharePrice || 0) || 0,
        Shares: Number(payload.Shares || payload.nShares || 0) || 0,
        SaveAmount: Number(payload.SaveAmount || payload.nSaveAmt || 0) || 0,
        SaveType: !!(payload.SaveType || payload.nSaveType),

        Sign1: payload.Sign1 || payload.signatory1 || '',
        Sign2: payload.Sign2 || payload.signatory2 || '',
        Sign3: payload.Sign3 || payload.signatory3 || '',
        Sign4: payload.Sign4 || payload.signatory4 || '',

        CompId: Number(payload.CompanyId || useAuthStore.getState().user?.CompId || 0) || 0,
        BranchId: Number(payload.BranchId || useAuthStore.getState().user?.BranchId || 0) || 0,
        BatchId: Number(payload.BatId || payload.BatchId || 0) || 0,
        MemType: Number(payload.MemType || 0) || 0,

        // Some backend SPs expect these parameters to be supplied (empty string if no image)
        MemPicture: pictureBase64 || payload.MemberPicture || payload.MemPicture || '',
        MemSignature: signatureBase64 || payload.MemberSignature || payload.MemSignature || '',
        applicationForm: applicationFormBase64 || payload.ApplicationForm || '',

        EditedBy: payload.EditedBy || useAuthStore.getState().user?.username || '',
      };

      // Call feature-scoped hook to update institution with API-shaped payload
      const result = await updateInstitution(updatePayload);
      setStatusMessage('Institution updated successfully.');
      setStatusError(false);
      notifySaveSuccess({ page: 'Customer Administration / Registration', action: 'Update Institution', message: 'Institution updated successfully.', metadata: payload });
      if (result) {
        const memberData = formatRecentMemberRow(result, institutionBranches);
        setRecentMember({ ...result, ...memberData });
      }
    } catch (err) {
      setStatusMessage(err.message || 'Failed to update institution');
      setStatusError(true);
      notifySaveError({ page: 'Customer Administration / Registration', action: 'Update Institution', message: 'Failed to update institution', error: err, metadata: null });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!recentMember) {
      setStatusMessage('Please save a registration before printing receipt.');
      setStatusError(true);
      return;
    }

    const printWindow = window.open('', '_blank', 'width=720,height=820');
    if (!printWindow) {
      setStatusMessage('Unable to open print window. Please allow pop-ups and try again.');
      setStatusError(true);
      return;
    }

    const now = new Date().toLocaleString();
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Registration Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
          .receipt-container { max-width: 600px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .header h2 { margin: 0; color: #333; }
          .header p { margin: 5px 0; font-size: 12px; color: #666; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; background-color: #f0f0f0; padding: 10px; margin-bottom: 10px; }
          .content-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .content-row span:first-child { font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 2px solid #333; font-size: 12px; color: #666; }
          .print-button { text-align: center; margin-top: 20px; }
          button { padding: 10px 30px; font-size: 16px; background-color: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background-color: #5568d3; }
          @media print { .print-button { display: none; } }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h2>Customer Registration Receipt</h2>
            <p>Date: ${now}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Registration Details</div>
            <div class="content-row">
              <span>Customer Code:</span>
              <span>${recentMember.memberCode || '-'}</span>
            </div>
            <div class="content-row">
              <span>Full Name:</span>
              <span>${recentMember.fullName || '-'}</span>
            </div>
            <div class="content-row">
              <span>Date Joined:</span>
              <span>${recentMember.dateJoined || '-'}</span>
            </div>
            <div class="content-row">
              <span>Date of Birth:</span>
              <span>${recentMember.dateOfBirth || '-'}</span>
            </div>
            <div class="content-row">
              <span>Branch:</span>
              <span>${recentMember.branch || '-'}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated receipt. Please keep for your records.</p>
            <p>Registration System © 2024</p>
          </div>
          
          <div class="print-button">
            <button onclick="window.print()">🖨️ Print</button>
            <button onclick="window.close()" style="margin-left: 10px; background-color: #999;">Close</button>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };



  return (
    <Box p={3} sx={{ position: 'relative' }}>
      <Backdrop
        open={isSaving}
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={96} thickness={5} />
          <Typography variant="h6" fontWeight={800}>Saving registration...</Typography>
        </Box>
      </Backdrop>

      <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white', mb: 3, p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>
          Registration Individual or Institution
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 400 }}>
          Register new members to the microfinance system
        </Typography>
      </Box>

      {/* Find customer search */}
      {/* Top-level search moved inside each tab */}

      {saveValidationErrors && (saveValidationErrors.missingFields.length > 0 || saveValidationErrors.invalidMessages.length > 0) && (
        <Alert
          severity="error"
          variant="outlined"
          sx={{ mb: 2, '& .MuiAlert-message': { width: '100%' } }}
          onClose={() => setSaveValidationErrors(null)}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Please fix the highlighted fields before saving</AlertTitle>
          {saveValidationErrors.missingFields.length > 0 && (
            <Box sx={{ mb: saveValidationErrors.invalidMessages.length > 0 ? 1.5 : 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Missing required fields
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {saveValidationErrors.missingFields.map((label) => (
                  <Chip key={label} label={label} size="small" color="error" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
          {saveValidationErrors.invalidMessages.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Please correct
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {saveValidationErrors.invalidMessages.map((msg) => (
                  <Typography component="li" variant="body2" key={msg}>
                    {msg}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
        </Alert>
      )}

      {!saveValidationErrors && statusMessage && (
        <Alert
          severity={statusError ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => setStatusMessage('')}
        >
          {statusMessage}
        </Alert>
      )}

      <Tabs
        value={mainTab}
        onChange={(_, nextTab) => setMainTab(nextTab)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={mainTabGroupSx}
      >
        <Tab label="Individual" />
        <Tab label="Institution" />
      </Tabs>

      {(mainTab === 0 || mainTab === 1) && (
        <Box
          component="fieldset"
          disabled={isReadOnlyRole}
          sx={{
            border: 'none',
            p: 0,
            m: 0,
            opacity: isReadOnlyRole ? 0.55 : 1,
            pointerEvents: isReadOnlyRole ? 'none' : 'auto',
            '& .MuiInputLabel-root, & .MuiFormLabel-root': {
              fontWeight: 600,
              fontSize: '1.2rem',
            },
            '& .MuiFormLabel-asterisk': {
              color: 'error.main',
              fontSize: '2rem',
              fontWeight: 800,
            },
          }}
        >
          <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              {mainTab === 0 ? (
                <>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
                    {/* Individual tab: Find Customer */}
                    <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2, alignItems: 'center' }}>
                      <TextField
                        label="Find Customer"
                        placeholder="Enter member code"
                        size="small"
                        value={individualSearchCode}
                        onChange={(e) => setIndividualSearchCode(e.target.value)}
                      />
                      <Button variant="contained" onClick={handleFillFromMember} disabled={loadingMemberDetails || !individualSearchCode} sx={{ backgroundColor: '#667eea' }}>
                        {loadingMemberDetails ? 'Searching...' : 'Search'}
                      </Button>
                      <Button variant="outlined" onClick={clearIndividualFields}>
                        Clear
                      </Button>
                    </Box>
                    <TextField
                      required
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={() => handleBlur('firstName')}
                      error={isFieldInvalid('firstName')}
                      helperText={isFieldInvalid('firstName') ? 'First Name is required' : ''}
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
                      }}
                    />
                    <TextField label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
                    <TextField
                      required
                      label="Surname"
                      name="surname"
                      value={formData.surname}
                      onChange={handleChange}
                      onBlur={() => handleBlur('surname')}
                      error={isFieldInvalid('surname')}
                      helperText={isFieldInvalid('surname') ? 'Surname is required' : ''}
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
                      }}
                    />
                    <TextField
                      select
                      required
                      label="Branch"
                      name="institutionBranch"
                      value={formData.institutionBranch}
                      onChange={handleChange}
                      onBlur={() => handleBlur('institutionBranch')}
                      error={isFieldInvalid('institutionBranch')}
                      helperText={isFieldInvalid('institutionBranch') ? 'Branch is required' : ''}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (selected) => selected || 'Select branch',
                      }}
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select branch
                      </MenuItem>
                      {institutionBranches.map((item) => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={<Checkbox name="memberEmployed" checked={formData.memberEmployed} onChange={handleChange} />}
                      label="Member is Employed"
                    />
                    <FormControlLabel
                      control={<Checkbox name="sendSms" checked={formData.sendSms} onChange={handleChange} />}
                      label="Check to Send SMS"
                    />
                    <FormControlLabel
                      control={<Checkbox name="registerMobileWallet" checked={formData.registerMobileWallet} onChange={handleChange} />}
                      label="Register member for Mobile Wallet"
                    />
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                      {/* Institution tab: Find Customer (institution) */}
                      <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          label="Find Institution"
                          placeholder="Enter institution code"
                          size="small"
                          value={institutionSearchCode}
                          onChange={(e) => setInstitutionSearchCode(e.target.value)}
                        />
                        <Button variant="contained" onClick={handleFillFromInstitution} disabled={loadingInstitutionDetails || !institutionSearchCode} sx={{ backgroundColor: '#667eea' }}>
                          {loadingInstitutionDetails ? 'Searching...' : 'Search'}
                        </Button>
                        <Button variant="outlined" onClick={clearInstitutionFields}>
                          Clear
                        </Button>
                      </Box>
                    <TextField
                      select
                      required
                      label="Institution Type"
                      name="institutionType"
                      value={formData.institutionType}
                      onChange={handleChange}
                      onBlur={() => handleBlur('institutionType')}
                      error={isFieldInvalid('institutionType')}
                      helperText={isFieldInvalid('institutionType') ? 'Institution Type is required' : ''}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (selected) => selected || 'Select institution type',
                      }}
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select institution type
                      </MenuItem>
                      <MenuItem value="group">Group</MenuItem>
                      <MenuItem value="corporate">Corporate / Institution</MenuItem>
                    </TextField>
                    <TextField
                      required
                      label="Institution Name"
                      name="institutionName"
                      value={formData.institutionName}
                      onChange={handleChange}
                      onBlur={() => handleBlur('institutionName')}
                      error={isFieldInvalid('institutionName')}
                      helperText={isFieldInvalid('institutionName') ? 'Institution Name is required' : ''}
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
                      }}
                    />
                    <TextField
                      select
                      required
                      label="Business Category"
                      name="institutionNature"
                      value={formData.institutionNature}
                      onChange={handleChange}
                      onBlur={() => handleBlur('institutionNature')}
                      error={isFieldInvalid('institutionNature')}
                      helperText={isFieldInvalid('institutionNature') ? 'Business Category is required' : ''}
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
                      }}
                    >
                      <MenuItem value="">Select business category</MenuItem>
                      <MenuItem value={1}>Business</MenuItem>
                      <MenuItem value={2}>Association</MenuItem>
                      <MenuItem value={3}>NGO</MenuItem>
                      <MenuItem value={4}>Cooperative</MenuItem>
                    </TextField>
                    {/* Company ID and Branch ID fields removed: set from backend/API only */}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Tabs
                value={detailTab}
                onChange={(_, nextTab) => setDetailTab(nextTab)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={detailTabGroupSx}
              >
                <Tab label="Basic Details" />
                <Tab label={mainTab === 1 ? 'Representative' : 'Contact Details'} />
                <Tab label={mainTab === 1 ? 'Reference' : 'Employment Detail'} />
                <Tab label="Contribution" />
                <Tab label="Biometric" />
                {mainTab === 1 && <Tab label="Group Member" />}
                {mainTab === 1 && <Tab label="Background" />}
                {mainTab === 1 && <Tab label="Trainings" />}
                {mainTab === 1 && <Tab label="Projects Implemented" />}
                {mainTab === 1 && <Tab label="Banking Information" />}
              </Tabs>

              {detailTab === 0 && (
                mainTab === 1 ? (
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Info
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            select
                            required
                            label="Country"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            onBlur={() => handleBlur('country')}
                            error={Boolean(fieldErrors.country) || (touched.country && !formData.country)}
                            helperText={touched.country && !formData.country ? 'Country is required' : ''}
                          >
                            <MenuItem value="">Select country</MenuItem>
                            {countries.map((country) => (
                              <MenuItem key={country.id} value={country.id}>
                                {country.name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            required
                            label="City"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            onBlur={() => handleBlur('city')}
                            error={isFieldInvalid('city') || Boolean(fieldErrors.city)}
                            helperText={isFieldInvalid('city') ? 'City is required' : ''}
                          >
                            <MenuItem value="">Select city</MenuItem>
                            {cities.map((city) => (
                              <MenuItem key={`city-${city.id}-${city.name}`} value={city.name}>
                                {city.name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            required
                            label="District"
                            name="district"
                            value={formData.district || ''}
                            onChange={handleChange}
                            onBlur={() => handleBlur('district')}
                            error={Boolean(fieldErrors.district) || (touched.district && !formData.district)}
                            helperText={touched.district && !formData.district ? 'District is required' : ''}
                          >
                            <MenuItem value="">Select district</MenuItem>
                            {districts.map((district) => (
                              <MenuItem key={`district-${district.id}-${district.name}`} value={district.id}>
                                {district.name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            required
                            label="Street"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.address) || (touched.address && !formData.address)}
                            helperText={touched.address && !formData.address ? 'Address is required' : ''}
                          />
                          <TextField
                            required
                            label="Tel"
                            name="mobilePhoneNumber"
                            value={formData.mobilePhoneNumber}
                            onChange={handleChange}
                            onBlur={() => handleBlur('mobilePhoneNumber')}
                            error={Boolean(fieldErrors.mobilePhoneNumber) || Boolean(getPhoneError('mobilePhoneNumber', 'Tel'))}
                            helperText={getPhoneError('mobilePhoneNumber', 'Tel')}
                          />
                          <TextField
                            label="Tel1"
                            name="tel1"
                            value={formData.tel1 || ''}
                            onChange={handleChange}
                          />
                          <TextField
                            label="Email"
                            name="emailAddress"
                            value={formData.emailAddress}
                            onChange={handleChange}
                            onBlur={() => handleBlur('emailAddress')}
                            error={Boolean(getEmailFormatError('emailAddress'))}
                            helperText={getEmailFormatError('emailAddress')}
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />

                          <FormControl sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                            <FormLabel>Residency</FormLabel>
                            <RadioGroup row name="institutionResidency" value={formData.institutionResidency} onChange={handleChange}>
                              <FormControlLabel value="resident" control={<Radio />} label="Resident" />
                              <FormControlLabel value="non-resident" control={<Radio />} label="Non Residence" />
                            </RadioGroup>
                          </FormControl>
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Institution Details
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            required
                            label="Incoporation Number"
                            name="institutionIncoporationNumber"
                            value={formData.institutionIncoporationNumber}
                            onChange={handleChange}
                            onBlur={() => handleBlur('institutionIncoporationNumber')}
                            error={Boolean(fieldErrors.institutionIncoporationNumber) || (touched.institutionIncoporationNumber && !formData.institutionIncoporationNumber)}
                            helperText={touched.institutionIncoporationNumber && !formData.institutionIncoporationNumber ? 'Incoporation Number is required' : ''}
                          />
                          <TextField
                            required
                            label="TIN"
                            name="institutionTIN"
                            value={formData.institutionTIN}
                            onChange={handleChange}
                            onBlur={() => handleBlur('institutionTIN')}
                            error={Boolean(fieldErrors.institutionTIN) || (touched.institutionTIN && !formData.institutionTIN)}
                            helperText={touched.institutionTIN && !formData.institutionTIN ? 'TIN is required' : ''}
                          />
                          <DatePicker
                            required
                            label="Incoporation date"
                            value={formData.institutionIncoporationDate ? dayjs(formData.institutionIncoporationDate) : null}
                            onChange={(value) => handleDateChange('institutionIncoporationDate', value)}
                            disableFuture
                            slotProps={{
                              textField: {
                                name: 'institutionIncoporationDate',
                                required: true,
                                onBlur: () => handleBlur('institutionIncoporationDate'),
                                error: touched.institutionIncoporationDate && !formData.institutionIncoporationDate,
                                helperText: touched.institutionIncoporationDate && !formData.institutionIncoporationDate ? 'Incoporation date is required' : '',
                              },
                            }}
                          />
                          <DatePicker
                            required
                            label="Date joined"
                            value={formData.institutionDateJoined ? dayjs(formData.institutionDateJoined) : null}
                            onChange={(value) => handleDateChange('institutionDateJoined', value)}
                            disableFuture
                            slotProps={{
                              textField: {
                                name: 'institutionDateJoined',
                                required: true,
                                onBlur: () => handleBlur('institutionDateJoined'),
                                error: touched.institutionDateJoined && !formData.institutionDateJoined,
                                helperText: touched.institutionDateJoined && !formData.institutionDateJoined ? 'Date joined is required' : '',
                              },
                            }}
                          />
                          <TextField
                            select
                            required
                            label="Region"
                            name="institutionRegion"
                            value={formData.institutionRegion}
                            onChange={handleChange}
                            onBlur={() => handleBlur('institutionRegion')}
                            error={touched.institutionRegion && !formData.institutionRegion}
                            helperText={touched.institutionRegion && !formData.institutionRegion ? 'Region is required' : ''}
                          >
                            <MenuItem value="">Select region</MenuItem>
                            <MenuItem value={1}>Banjul</MenuItem>
                            <MenuItem value={2}>Kanifing</MenuItem>
                            <MenuItem value={3}>West Coast</MenuItem>
                            <MenuItem value={4}>North Bank</MenuItem>
                            <MenuItem value={5}>Lower River</MenuItem>
                            <MenuItem value={6}>Central River</MenuItem>
                            <MenuItem value={7}>Upper River</MenuItem>
                          </TextField>
                          <TextField
                            select
                            required
                            label="District"
                            name="institutionDistrict"
                            value={formData.institutionDistrict || ''}
                            onChange={handleChange}
                            onBlur={() => handleBlur('institutionDistrict')}
                            error={touched.institutionDistrict && !formData.institutionDistrict}
                            helperText={touched.institutionDistrict && !formData.institutionDistrict ? 'District is required' : ''}
                          >
                            <MenuItem value="">Select district</MenuItem>
                            {districts.map((district) => (
                              <MenuItem key={`district-${district.id}-${district.name}`} value={district.id}>
                                {district.name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            required
                            label="Ward"
                            name="institutionWard"
                            value={formData.institutionWard}
                            onChange={handleChange}
                            onBlur={() => handleBlur('institutionWard')}
                            error={touched.institutionWard && !formData.institutionWard}
                            helperText={touched.institutionWard && !formData.institutionWard ? 'Ward is required' : ''}
                          >
                            <MenuItem value="">Select ward</MenuItem>
                            {wards.map((ward) => (
                              <MenuItem key={`ward-${ward.id}-${ward.name}`} value={ward.id}>
                                {ward.name}
                              </MenuItem>
                            ))}
                          </TextField>

                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Personal Profile
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            select
                            required
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            onBlur={() => handleBlur('title')}
                            error={isFieldInvalid('title')}
                            helperText={isFieldInvalid('title') ? 'Title is required' : ''}
                          >
                            {[
                              { tit_name: 'MR.', tit_id: 1 },
                              { tit_name: 'MRS', tit_id: 2 },
                              { tit_name: 'MS', tit_id: 3 },
                              { tit_name: 'ALHAJ', tit_id: 4 },
                              { tit_name: 'PROF.', tit_id: 5 },
                              { tit_name: 'DR.', tit_id: 6 },
                              { tit_name: 'Sister', tit_id: 7 },
                            ].map((t) => (
                              <MenuItem key={t.tit_id} value={t.tit_id}>
                                {t.tit_name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            required
                            label="Gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            onBlur={() => handleBlur('gender')}
                            error={isFieldInvalid('gender')}
                            helperText={isFieldInvalid('gender') ? 'Gender is required' : ''}
                          >
                            <MenuItem value={1}>Male</MenuItem>
                            <MenuItem value={2}>Female</MenuItem>
                          </TextField>
                          <TextField
                              required
                              select
                              label="Nationality"
                              name="nationality"
                              value={formData.nationality}
                              onChange={handleChange}
                              onBlur={() => handleBlur('nationality')}
                              error={isFieldInvalid('nationality')}
                              helperText={isFieldInvalid('nationality') ? 'Nationality is required' : ''}
                            >
                              <MenuItem value="">Select nationality</MenuItem>
                              {countries.map((country) => (
                                <MenuItem key={`nationality-${country.id}-${country.name}`} value={country.name}>{country.name}</MenuItem>
                              ))}
                            </TextField>
                          <TextField label="Tribe" name="tribe" value={formData.tribe} onChange={handleChange} />
                          <TextField label="Level of Education" name="levelOfEducation" value={formData.levelOfEducation} onChange={handleChange} />
                          <TextField
                            select
                            required
                            label="Marital status"
                            name="maritalStatus"
                            value={formData.maritalStatus}
                            onChange={handleChange}
                            onBlur={() => handleBlur('maritalStatus')}
                            error={isFieldInvalid('maritalStatus')}
                            helperText={isFieldInvalid('maritalStatus') ? 'Marital status is required' : ''}
                          >
                            <MenuItem value="single">Single</MenuItem>
                            <MenuItem value="married">Married</MenuItem>
                            <MenuItem value="divorced">Divorced</MenuItem>
                            <MenuItem value="widowed">Widowed</MenuItem>
                          </TextField>
                          <DatePicker
                            label="Date of Birth"
                            required
                            value={formData.dateOfBirth ? dayjs(formData.dateOfBirth) : null}
                            onChange={(value) => handleDateChange('dateOfBirth', value)}
                            disableFuture
                            slotProps={{
                              textField: {
                                name: 'dateOfBirth',
                                required: true,
                                onBlur: () => handleBlur('dateOfBirth'),
                                error: Boolean(getDateOfBirthError()),
                                helperText: getDateOfBirthError(),
                              },
                            }}
                          />
                          <DatePicker
                            label="Date Joined"
                            required
                            value={formData.dateJoined ? dayjs(formData.dateJoined) : null}
                            onChange={(value) => handleDateChange('dateJoined', value)}
                            disableFuture
                            slotProps={{
                              textField: {
                                name: 'dateJoined',
                                required: true,
                                onBlur: () => handleBlur('dateJoined'),
                                error: touched.dateJoined && !formData.dateJoined,
                                helperText: touched.dateJoined && !formData.dateJoined ? 'Date Joined is required' : '',
                              },
                            }}
                          />
                          <TextField select label="Income Range" name="povertyLevel" value={formData.povertyLevel} onChange={handleChange}>
                            <MenuItem value="0-5000">0 - 5,000</MenuItem>
                            <MenuItem value="5001-10000">5,001 - 10,000</MenuItem>
                            <MenuItem value="10001-25000">10,001 - 25,000</MenuItem>
                            <MenuItem value="25001-50000">25,001 - 50,000</MenuItem>
                            <MenuItem value="50001+">50,001+</MenuItem>
                          </TextField>
                          <FormControl sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                            <FormLabel>Resident Type</FormLabel>
                            <RadioGroup row name="residency" value={formData.residency} onChange={handleChange}>
                              <FormControlLabel value="resident" control={<Radio />} label="Resident" />
                              <FormControlLabel value="non-resident" control={<Radio />} label="Non Resident" />
                            </RadioGroup>
                          </FormControl>
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Identity And Location
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            select
                            required
                            label="ID Type"
                            name="idType"
                            value={formData.idType}
                            onChange={handleChange}
                            onBlur={() => handleBlur('idType')}
                            error={isFieldInvalid('idType')}
                            helperText={isFieldInvalid('idType') ? 'ID Type is required' : ''}
                          >
                            {idTypesLoading ? (
                              <MenuItem value="">Loading...</MenuItem>
                            ) : (
                              idTypeOptions.map((opt) => (
                                <MenuItem key={opt.idtype} value={String(opt.idtype)}>
                                  {opt.id_name?.trim() || String(opt.idtype)}
                                </MenuItem>
                              ))
                            )}
                          </TextField>
                          <TextField
                            required
                            label="ID number"
                            name="idNumber"
                            value={formData.idNumber}
                            onChange={handleChange}
                            onBlur={() => handleBlur('idNumber')}
                            error={isFieldInvalid('idNumber')}
                            helperText={isFieldInvalid('idNumber') ? 'ID number is required' : ''}
                          />
                          <TextField
                            required
                            label="Place Issued"
                            name="placeIssue"
                            value={formData.placeIssue}
                            onChange={handleChange}
                            onBlur={() => handleBlur('placeIssue')}
                            error={isFieldInvalid('placeIssue')}
                            helperText={isFieldInvalid('placeIssue') ? 'Place Issued is required' : ''}
                          />
                          <DatePicker
                            label="Date Issued"
                            required
                            value={formData.dateIssued ? dayjs(formData.dateIssued) : null}
                            onChange={(value) => handleDateChange('dateIssued', value)}
                            disableFuture
                            slotProps={{
                              textField: {
                                name: 'dateIssued',
                                required: true,
                                onBlur: () => handleBlur('dateIssued'),
                                error: touched.dateIssued && !formData.dateIssued,
                                helperText: touched.dateIssued && !formData.dateIssued ? 'Date Issued is required' : '',
                              },
                            }}
                          />
                          <DatePicker
                            label="Expiry Date"
                            required
                            value={formData.expiryDate ? dayjs(formData.expiryDate) : null}
                            onChange={(value) => handleDateChange('expiryDate', value)}
                            slotProps={{
                              textField: {
                                name: 'expiryDate',
                                required: true,
                                onBlur: () => handleBlur('expiryDate'),
                                error: Boolean(getExpiryDateError()),
                                helperText: getExpiryDateError(),
                              },
                            }}
                          />
                          <TextField
                            select
                            label="Region"
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                            required
                            error={touched.region && !formData.region}
                            helperText={touched.region && !formData.region ? 'Region is required' : ''}
                          >
                            <MenuItem value="">Select region</MenuItem>
                            <MenuItem value={1}>Banjul</MenuItem>
                            <MenuItem value={2}>Kanifing</MenuItem>
                            <MenuItem value={3}>West Coast</MenuItem>
                            <MenuItem value={4}>North Bank</MenuItem>
                            <MenuItem value={5}>Lower River</MenuItem>
                            <MenuItem value={6}>Central River</MenuItem>
                            <MenuItem value={7}>Upper River</MenuItem>
                          </TextField>
                          <TextField
                            select
                            label="District"
                            name="district"
                            value={formData.district || ''}
                            onChange={handleChange}
                            required
                            error={touched.district && !formData.district}
                            helperText={touched.district && !formData.district ? 'District is required' : ''}
                          >
                            <MenuItem value="">Select district</MenuItem>
                            {districts.map((district) => (
                              <MenuItem key={`district-${district.id}-${district.name}`} value={district.id}>
                                {district.name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            label="Ward"
                            name="ward"
                            value={formData.ward}
                            onChange={handleChange}
                            required
                            error={touched.ward && !formData.ward}
                            helperText={touched.ward && !formData.ward ? 'Ward is required' : ''}
                          >
                            <MenuItem value="">Select ward</MenuItem>
                            {wards.map((ward) => (
                              <MenuItem key={`ward-${ward.id}-${ward.name}`} value={ward.id}>
                                {ward.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )
              )}

              {detailTab === 1 && mainTab === 1 && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Chair
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            required
                            label="Name"
                            name="chairName"
                            value={formData.chairName}
                            onChange={handleChange}
                            onBlur={() => handleBlur('chairName')}
                            error={Boolean(fieldErrors.chairName) || (touched.chairName && !formData.chairName)}
                            helperText={touched.chairName && !formData.chairName ? 'Name is required' : ''}
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                          <TextField label="TIN" name="chairTIN" value={formData.chairTIN} onChange={handleChange} />
                          <DatePicker
                            required
                            label="Date of Birth"
                            value={formData.chairDOB ? dayjs(formData.chairDOB) : null}
                            onChange={value => handleChange({ target: { name: 'chairDOB', value: value ? value.format('YYYY-MM-DD') : '' } })}
                            disableFuture
                            slotProps={{
                              textField: {
                                name: 'chairDOB',
                                required: true,
                                onBlur: () => handleBlur('chairDOB'),
                                error: touched.chairDOB && !formData.chairDOB,
                                helperText: touched.chairDOB && !formData.chairDOB ? 'Date of Birth is required' : '',
                              },
                            }}
                          />
                          <TextField
                            required
                            label="Mobile Phone"
                            name="chairMobilePhone"
                            value={formData.chairMobilePhone}
                            onChange={handleChange}
                            onBlur={() => handleBlur('chairMobilePhone')}
                            error={Boolean(fieldErrors.chairMobilePhone) || Boolean(getPhoneError('chairMobilePhone', 'Mobile Phone'))}
                            helperText={getPhoneError('chairMobilePhone', 'Mobile Phone')}
                          />
                          <TextField
                            label="Email Address"
                            name="chairEmailAddress"
                            value={formData.chairEmailAddress}
                            onChange={handleChange}
                            onBlur={() => handleBlur('chairEmailAddress')}
                            error={Boolean(fieldErrors.chairEmailAddress) || Boolean(getEmailFormatError('chairEmailAddress'))}
                            helperText={getEmailFormatError('chairEmailAddress')}
                          />
                          <FormControlLabel
                            control={<Checkbox name="chairAccountSignatory" checked={formData.chairAccountSignatory} onChange={handleChange} />}
                            label="Account Signatory"
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Vice Chair
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField label="Name" name="viceChairName" value={formData.viceChairName} onChange={handleChange} sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }} />
                          <TextField label="TIN" name="viceChairTIN" value={formData.viceChairTIN} onChange={handleChange} />
                          <TextField label="Mobile Phone" name="viceChairMobilePhone" value={formData.viceChairMobilePhone} onChange={handleChange} />
                          <TextField label="Email Address" name="viceChairEmailAddress" value={formData.viceChairEmailAddress} onChange={handleChange} />
                          <FormControlLabel
                            control={<Checkbox name="viceChairAccountSignatory" checked={formData.viceChairAccountSignatory} onChange={handleChange} />}
                            label="Account Signatory"
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Treasurer
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            label="Name"
                            name="treasurerName"
                            value={formData.treasurerName}
                            onChange={handleChange}
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                          <TextField label="TIN" name="treasurerTIN" value={formData.treasurerTIN} onChange={handleChange} />
                          <TextField
                            label="Mobile Phone"
                            name="treasurerMobilePhone"
                            value={formData.treasurerMobilePhone}
                            onChange={handleChange}
                          />
                          <TextField
                            label="Email Address"
                            name="treasurerEmailAddress"
                            value={formData.treasurerEmailAddress}
                            onChange={handleChange}
                          />
                          <FormControlLabel
                            control={<Checkbox name="treasurerAccountSignatory" checked={formData.treasurerAccountSignatory} onChange={handleChange} />}
                            label="Account Signatory"
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Secretary
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField label="Name" name="secretaryName" value={formData.secretaryName} onChange={handleChange} sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }} />
                          <TextField label="TIN" name="secretaryTIN" value={formData.secretaryTIN} onChange={handleChange} />
                          <TextField label="Mobile Phone" name="secretaryMobilePhone" value={formData.secretaryMobilePhone} onChange={handleChange} />
                          <TextField label="Email Address" name="secretaryEmailAddress" value={formData.secretaryEmailAddress} onChange={handleChange} />
                          <FormControlLabel
                            control={<Checkbox name="secretaryAccountSignatory" checked={formData.secretaryAccountSignatory} onChange={handleChange} />}
                            label="Account Signatory"
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                        Account Signatories
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 2 }}>
                        <TextField
                          required
                          label="Signatory 1"
                          name="signatory1"
                          value={formData.signatory1}
                          onChange={handleChange}
                          onBlur={() => handleBlur('signatory1')}
                          error={isFieldInvalid('signatory1')}
                          helperText={isFieldInvalid('signatory1') ? 'Signatory 1 is required' : ''}
                        />
                        <TextField
                          label="Signatory 2"
                          name="signatory2"
                          value={formData.signatory2}
                          onChange={handleChange}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {detailTab === 1 && mainTab === 0 && (
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                        Info
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                        <TextField
                                  select
                                  required
                                  label="Country of Residence"
                                  name="country"
                                  value={formData.country}
                                  onChange={handleChange}
                                  onBlur={() => handleBlur('country')}
                                  error={isFieldInvalid('country')}
                                  helperText={isFieldInvalid('country') ? 'Country of Residence is required' : ''}
                                >
                                  <MenuItem value="">Select country</MenuItem>
                                  {countries.map((country) => (
                                    <MenuItem key={country.id} value={country.id}>{country.name}</MenuItem>
                                  ))}
                                </TextField>
                        <TextField
                          select
                          required
                          label="City"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          onBlur={() => handleBlur('city')}
                          error={isFieldInvalid('city')}
                          helperText={isFieldInvalid('city') ? 'City is required' : ''}
                        >
                          <MenuItem value="">Select city</MenuItem>
                          {cities.map((city) => (
                            <MenuItem key={`city-${city.id}-${city.name}`} value={city.name}>{city.name}</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          required
                          label="Address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          error={touched.address && !formData.address}
                          helperText={touched.address && !formData.address ? 'Address is required' : ''}
                        />
                        <TextField
                          required
                          label="Mobile Phone number"
                          name="mobilePhoneNumber"
                          value={formData.mobilePhoneNumber}
                          onChange={handleChange}
                          onBlur={() => handleBlur('mobilePhoneNumber')}
                          error={Boolean(getPhoneError('mobilePhoneNumber', 'Mobile Phone number'))}
                          helperText={getPhoneError('mobilePhoneNumber', 'Mobile Phone number')}
                        />
                        <TextField
                          label="Email address"
                          name="emailAddress"
                          value={formData.emailAddress}
                          onChange={handleChange}
                          onBlur={() => handleBlur('emailAddress')}
                          error={Boolean(getEmailFormatError('emailAddress'))}
                          helperText={getEmailFormatError('emailAddress')}
                          sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                        Referee's Contact Details
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                        <TextField label="Name" name="refereeName" value={formData.refereeName} onChange={handleChange} />
                        <TextField label="Address" name="refereeAddress" value={formData.refereeAddress} onChange={handleChange} />
                        <TextField label="Mobile Phone" name="refereeMobilePhone" value={formData.refereeMobilePhone} onChange={handleChange} />
                        <TextField label="Email address" name="refereeEmailAddress" value={formData.refereeEmailAddress} onChange={handleChange} />
                      </Box>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          Next of kin Details
                        </Typography>
                        <Button variant="outlined" size="small" onClick={handleAddNextOfKinCard}>
                          Add More Next of Kin
                        </Button>
                      </Box>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                        <TextField
                          required
                          label="Name"
                          name="nextOfKinName"
                          value={formData.nextOfKinName}
                          onChange={handleChange}
                          onBlur={() => handleBlur('nextOfKinName')}
                          error={isFieldInvalid('nextOfKinName')}
                          helperText={isFieldInvalid('nextOfKinName') ? 'Name is required' : ''}
                        />
                        <TextField label="Address" name="nextOfKinAddress" value={formData.nextOfKinAddress} onChange={handleChange} />
                        <TextField label="Relationship" name="nextOfKinRelationship" value={formData.nextOfKinRelationship} onChange={handleChange} />
                        <TextField label="Mobile Phone" name="nextOfKinMobilePhone" value={formData.nextOfKinMobilePhone} onChange={handleChange} />
                      </Box>
                    </CardContent>
                  </Card>

                  {additionalNextOfKins.map((nextOfKin, index) => (
                    <Card key={nextOfKin.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Next of kin Details {index + 2}
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            label="Name"
                            value={nextOfKin.name}
                            onChange={(event) => handleAdditionalNextOfKinChange(nextOfKin.id, 'name', event.target.value)}
                          />
                          <TextField
                            label="Address"
                            value={nextOfKin.address}
                            onChange={(event) => handleAdditionalNextOfKinChange(nextOfKin.id, 'address', event.target.value)}
                          />
                          <TextField
                            label="Relationship"
                            value={nextOfKin.relationship}
                            onChange={(event) => handleAdditionalNextOfKinChange(nextOfKin.id, 'relationship', event.target.value)}
                          />
                          <TextField
                            label="Mobile Phone"
                            value={nextOfKin.mobilePhone}
                            onChange={(event) => handleAdditionalNextOfKinChange(nextOfKin.id, 'mobilePhone', event.target.value)}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {detailTab === 3 && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Registration
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2 }}>
                          <FormControl>
                            <FormLabel>Saving Type</FormLabel>
                            <RadioGroup row name="savingMode" value={formData.savingMode} onChange={handleChange}>
                              <FormControlLabel value="fixed" control={<Radio />} label="Fixed" />
                              <FormControlLabel value="varible" control={<Radio />} label="Variable" />
                            </RadioGroup>
                          </FormControl>
                          <TextField
                            label="Registration Fee"
                            name="registrationFee"
                            value={formData.registrationFee}
                            onChange={handleChange}
                            onBlur={() => handleBlur('registrationFee')}
                            error={isFieldInvalid('registrationFee')}
                            helperText={isFieldInvalid('registrationFee') ? 'Registration Fee is required' : ''}
                            InputProps={{ startAdornment: <CurrencyAdornment /> }}
                          />
                          <TextField
                            label="Saving Amount"
                            name="savingAmount"
                            value={formData.savingAmount}
                            onChange={handleChange}
                            InputProps={{ startAdornment: <CurrencyAdornment /> }}
                          />
                          <TextField
                            label="Share Price"
                            name="sharePrice"
                            value={formData.sharePrice}
                            onChange={handleChange}
                            InputProps={{ startAdornment: <CurrencyAdornment /> }}
                            disabled
                            sx={{
                              '& .MuiInputBase-root.Mui-disabled': {
                                bgcolor: 'action.disabledBackground',
                              },
                              '& .MuiInputBase-input.Mui-disabled': {
                                WebkitTextFillColor: (theme) => theme.palette.text.disabled,
                              },
                            }}
                          />
                          <TextField
                            label="Share Purchased"
                            name="sharesPurchase"
                            value={formData.sharesPurchase}
                            onChange={handleChange}
                            disabled
                            sx={{
                              '& .MuiInputBase-root.Mui-disabled': {
                                bgcolor: 'action.disabledBackground',
                              },
                              '& .MuiInputBase-input.Mui-disabled': {
                                WebkitTextFillColor: (theme) => theme.palette.text.disabled,
                              },
                            }}
                          />
                          <TextField
                            label="Share Value"
                            name="shareValue"
                            value={formData.shareValue}
                            onChange={handleChange}
                            disabled
                            sx={{
                              '& .MuiInputBase-root.Mui-disabled': {
                                bgcolor: 'action.disabledBackground',
                              },
                              '& .MuiInputBase-input.Mui-disabled': {
                                WebkitTextFillColor: (theme) => theme.palette.text.disabled,
                              },
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    {mainTab === 0 && (
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Account Signatories
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2 }}>
                          <TextField
                            required
                            label="Signatory 1"
                            name="signatory1"
                            value={formData.signatory1}
                            onChange={handleChange}
                            onBlur={() => handleBlur('signatory1')}
                            error={isFieldInvalid('signatory1')}
                            helperText={isFieldInvalid('signatory1') ? 'Signatory 1 is required' : ''}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                    )}
                  </Box>
                </Box>
              )}

              {detailTab === 2 && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Employer Details
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField select label="Employer" name="employer" value={formData.employer} onChange={handleChange}>
                            <MenuItem value="">Select employer</MenuItem>
                            <MenuItem value="government">Government</MenuItem>
                            <MenuItem value="private">Private</MenuItem>
                            <MenuItem value="ngo">NGO</MenuItem>
                            <MenuItem value="self-employed">Self Employed</MenuItem>
                          </TextField>
                          <TextField label="Country" name="employmentCountry" value={formData.employmentCountry} onChange={handleChange} />
                          <TextField label="City" name="employmentCity" value={formData.employmentCity} onChange={handleChange} />
                          <TextField label="Address" name="employmentAddress" value={formData.employmentAddress} onChange={handleChange} />
                          <TextField label="Mobile Phone" name="employmentMobilePhone" value={formData.employmentMobilePhone} onChange={handleChange} />
                          <TextField
                            label="Email address"
                            name="employmentEmailAddress"
                            value={formData.employmentEmailAddress}
                            onChange={handleChange}
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          Employment
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            label="Employment number"
                            name="employmentNumber"
                            value={formData.employmentNumber}
                            onChange={handleChange}
                          />
                          <TextField select label="Designation" name="designation" value={formData.designation} onChange={handleChange}>
                            <MenuItem value="">Select designation</MenuItem>
                            <MenuItem value="manager">Manager</MenuItem>
                            <MenuItem value="supervisor">Supervisor</MenuItem>
                            <MenuItem value="officer">Officer</MenuItem>
                            <MenuItem value="assistant">Assistant</MenuItem>
                          </TextField>
                          <TextField select label="Department" name="department" value={formData.department} onChange={handleChange}>
                            <MenuItem value="">Select department</MenuItem>
                            <MenuItem value="finance">Finance</MenuItem>
                            <MenuItem value="operations">Operations</MenuItem>
                            <MenuItem value="hr">Human Resource</MenuItem>
                            <MenuItem value="it">IT</MenuItem>
                          </TextField>
                          <TextField
                            label="Number of years with current employment"
                            name="yearsWithCurrentEmployment"
                            value={formData.yearsWithCurrentEmployment}
                            onChange={handleChange}
                          />
                          <TextField
                            label="Current salary"
                            name="currentSalary"
                            value={formData.currentSalary}
                            onChange={handleChange}
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          References Details
                        </Typography>
                        <Button variant="outlined" size="small" onClick={handleAddReferenceCard}>
                          Add More References
                        </Button>
                      </Box>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                        <TextField
                          label="Name"
                          name="referenceDetailsName"
                          value={formData.referenceDetailsName}
                          onChange={handleChange}
                        />
                        <TextField
                          label="Address"
                          name="referenceDetailsAddress"
                          value={formData.referenceDetailsAddress}
                          onChange={handleChange}
                        />
                        <TextField
                          label="Mobile Phone"
                          name="referenceDetailsMobilePhone"
                          value={formData.referenceDetailsMobilePhone}
                          onChange={handleChange}
                        />
                        <TextField
                          label="Email Address"
                          name="referenceDetailsEmailAddress"
                          value={formData.referenceDetailsEmailAddress}
                          onChange={handleChange}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {additionalReferences.map((reference, index) => (
                    <Card key={reference.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                          References Details {index + 2}
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            label="Name"
                            value={reference.name}
                            onChange={(event) => handleAdditionalReferenceChange(reference.id, 'name', event.target.value)}
                          />
                          <TextField
                            label="Address"
                            value={reference.address}
                            onChange={(event) => handleAdditionalReferenceChange(reference.id, 'address', event.target.value)}
                          />
                          <TextField
                            label="Mobile Phone"
                            value={reference.mobilePhone}
                            onChange={(event) => handleAdditionalReferenceChange(reference.id, 'mobilePhone', event.target.value)}
                          />
                          <TextField
                            label="Email Address"
                            value={reference.emailAddress}
                            onChange={(event) => handleAdditionalReferenceChange(reference.id, 'emailAddress', event.target.value)}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}


              {((mainTab === 1 && detailTab === 4) || (mainTab !== 1 && detailTab === 4)) && (
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
                  {/* Biometric Tab Content */}
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                        Biometric
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 1.25 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button component="label" variant="outlined" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
                            Select a photo
                            <input
                              hidden
                              accept="image/*"
                              type="file"
                              onChange={(event) => handleBiometricFileChange('biometricPhotoName', event)}
                            />
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            disabled={!formData.biometricPhotoName}
                            onClick={() => handleRemoveBiometricFile('biometricPhotoName')}
                            sx={{ textTransform: 'none' }}
                          >
                            Remove photo
                          </Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {formData.biometricPhotoName || 'No photo selected.'}
                        </Typography>
                        <Box
                          sx={{
                            mt: 0.5,
                            p: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 8px rgba(15, 23, 42, 0.06)',
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
                            Photo Preview
                          </Typography>
                          <Box
                            sx={{
                              border: '1px dashed',
                              borderColor: 'divider',
                              borderRadius: 1.5,
                              minHeight: 180,
                              display: 'grid',
                              placeItems: 'center',
                              overflow: 'hidden',
                              bgcolor: 'action.hover',
                              cursor: photoPreviewUrl ? 'pointer' : 'default',
                              transition: 'all 0.2s ease',
                              '&:hover': photoPreviewUrl ? {
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                transform: 'scale(1.02)',
                              } : {},
                            }}
                            onClick={() => {
                              if (photoPreviewUrl) {
                                setExpandedImageUrl(photoPreviewUrl);
                                setExpandedImageOpen(true);
                              }
                            }}
                          >
                            {photoPreviewUrl ? (
                              <Box
                                component="img"
                                src={photoPreviewUrl}
                                alt="Selected photo preview"
                                sx={{ width: '100%', height: 180, objectFit: 'contain', objectPosition: 'center', borderRadius: 1, bgcolor: 'background.paper' }}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Selected picture preview will appear here.
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Signature Card */}
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                        Signature
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 1.25 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button component="label" variant="outlined" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
                            Select a Signature
                            <input
                              hidden
                              accept="image/*"
                              type="file"
                              onChange={(event) => handleBiometricFileChange('biometricSignatureName', event)}
                            />
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            disabled={!formData.biometricSignatureName}
                            onClick={() => handleRemoveBiometricFile('biometricSignatureName')}
                            sx={{ textTransform: 'none' }}
                          >
                            Remove signature
                          </Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {formData.biometricSignatureName || 'No signature selected.'}
                        </Typography>
                        <Box
                          sx={{
                            mt: 0.5,
                            p: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 8px rgba(15, 23, 42, 0.06)',
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
                            Signature Preview
                          </Typography>
                          <Box
                            sx={{
                              border: '1px dashed',
                              borderColor: 'divider',
                              borderRadius: 1.5,
                              minHeight: 180,
                              display: 'grid',
                              placeItems: 'center',
                              overflow: 'hidden',
                              bgcolor: 'action.hover',
                              cursor: signaturePreviewUrl ? 'pointer' : 'default',
                              transition: 'all 0.2s ease',
                              '&:hover': signaturePreviewUrl ? {
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                transform: 'scale(1.02)',
                              } : {},
                            }}
                            onClick={() => {
                              if (signaturePreviewUrl) {
                                setExpandedImageUrl(signaturePreviewUrl);
                                setExpandedImageOpen(true);
                              }
                            }}
                          >
                            {signaturePreviewUrl ? (
                              <Box
                                component="img"
                                src={signaturePreviewUrl}
                                alt="Selected signature preview"
                                sx={{ width: '100%', height: 180, objectFit: 'contain', bgcolor: 'background.paper', borderRadius: 1 }}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Selected signature preview will appear here.
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Application Form Card */}
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                        Application Form
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 1.25 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button component="label" variant="outlined" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
                            Select a Form
                            <input
                              hidden
                              accept="image/*"
                              type="file"
                              onChange={(event) => handleBiometricFileChange('applicationFormName', event)}
                            />
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            disabled={!formData.applicationFormName}
                            onClick={() => handleRemoveBiometricFile('applicationFormName')}
                            sx={{ textTransform: 'none' }}
                          >
                            Remove form
                          </Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {formData.applicationFormName || 'No form selected.'}
                        </Typography>
                        <Box
                          sx={{
                            mt: 0.5,
                            p: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 8px rgba(15, 23, 42, 0.06)',
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
                            Form Preview
                          </Typography>
                          <Box
                            sx={{
                              border: '1px dashed',
                              borderColor: 'divider',
                              borderRadius: 1.5,
                              minHeight: 180,
                              display: 'grid',
                              placeItems: 'center',
                              overflow: 'hidden',
                              bgcolor: 'action.hover',
                            }}
                          >
                            {applicationFormPreviewUrl ? (
                              <Box
                                component="img"
                                src={applicationFormPreviewUrl}
                                alt="Selected application form preview"
                                sx={{ width: '100%', height: 180, objectFit: 'contain', bgcolor: 'background.paper', borderRadius: 1 }}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Selected form preview will appear here.
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* Group Member tab content for Institution (last tab) */}
              {mainTab === 1 && detailTab === 5 && (
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
                  {/* Group Members Section */}
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Group Member Details
                      </Typography>
                      <Button variant="outlined" size="small" onClick={handleAddGroupMemberCard}>
                        Add more Group Member
                      </Button>
                    </Box>
                    {groupMembers && groupMembers.length > 0 ? (
                      groupMembers.map((member, index) => (
                        <Card key={member.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                              Group Member {index + 1}
                            </Typography>
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                              <TextField
                                required
                                label="First Name"
                                value={member.firstName}
                                onChange={e => handleGroupMemberChange(member.id, 'firstName', e.target.value)}
                              />
                              <DatePicker
                                required
                                label="Date of Birth"
                                value={member.dateOfBirth ? dayjs(member.dateOfBirth) : null}
                                onChange={value => handleGroupMemberChange(member.id, 'dateOfBirth', value ? value.format('YYYY-MM-DD') : '')}
                                disableFuture
                                slotProps={{ textField: { required: true } }}
                              />
                              <TextField
                                required
                                label="Last Name"
                                value={member.lastName}
                                onChange={e => handleGroupMemberChange(member.id, 'lastName', e.target.value)}
                              />
                              <TextField
                                required
                                label="Phone Number"
                                value={member.phoneNumber}
                                onChange={e => handleGroupMemberChange(member.id, 'phoneNumber', e.target.value)}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">No group members added yet.</Typography>
                    )}
                  </Box>

                  {/* Committee Members Section */}
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Committee Members</Typography>
                      <Button variant="outlined" size="small" onClick={handleAddCommitteeMemberCard}>
                        Add More Committee
                      </Button>
                    </Box>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        {committeeMembers.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No committee members added yet.</Typography>
                        ) : (
                          <Box sx={{ display: 'grid', gap: 2 }}>
                            {committeeMembers.map((member, index) => (
                              <Card key={member.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                                <CardContent>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                                    Committee Member {index + 1}
                                  </Typography>
                                  {index > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                      <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        onClick={() => handleDeleteCommitteeMember(member.id)}
                                        sx={{ textTransform: 'none' }}
                                      >
                                        Remove
                                      </Button>
                                    </Box>
                                  )}
                                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
                                    <TextField
                                      label="Names"
                                      value={member.names}
                                      onChange={(event) => handleCommitteeMemberChange(member.id, 'names', event.target.value)}
                                      placeholder="e.g. John Doe"
                                      fullWidth
                                    />
                                    <TextField
                                      label="Positions"
                                      value={member.positions}
                                      onChange={(event) => handleCommitteeMemberChange(member.id, 'positions', event.target.value)}
                                      placeholder="e.g. Chairperson"
                                      fullWidth
                                    />
                                    <TextField
                                      label="Literacy & Experiences"
                                      value={member.literacyExperiences}
                                      onChange={(event) => handleCommitteeMemberChange(member.id, 'literacyExperiences', event.target.value)}
                                      placeholder="e.g. Secondary Education"
                                      fullWidth
                                      multiline
                                      rows={3}
                                    />
                                  </Box>
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              )}

              {/* Background tab content for Institution */}
              {mainTab === 1 && detailTab === 8 && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Projects Implemented</Typography>
                        <Button variant="outlined" size="small" onClick={handleAddProjectCard}>
                          Add More Projects
                        </Button>
                      </Box>
                      {projects.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No projects added yet.</Typography>
                      ) : (
                        projects.map((project, index) => (
                          <Card key={project.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                            <CardContent>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                                Project {index + 1}
                              </Typography>
                              {index > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    onClick={() => handleDeleteProject(project.id)}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    Remove
                                  </Button>
                                </Box>
                              )}
                              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                                <TextField
                                  label="Year"
                                  type="number"
                                  value={project.year}
                                  onChange={(event) => handleProjectChange(project.id, 'year', event.target.value)}
                                  placeholder="e.g. 2023"
                                  fullWidth
                                />
                                <TextField
                                  label="Project Type"
                                  value={project.projectType}
                                  onChange={(event) => handleProjectChange(project.id, 'projectType', event.target.value)}
                                  placeholder="e.g. Water Project"
                                  fullWidth
                                />
                                <TextField
                                  label="Status"
                                  value={project.status}
                                  onChange={(event) => handleProjectChange(project.id, 'status', event.target.value)}
                                  placeholder="e.g. Completed"
                                  fullWidth
                                />
                                <TextField
                                  label="Supported By"
                                  value={project.supportedBy}
                                  onChange={(event) => handleProjectChange(project.id, 'supportedBy', event.target.value)}
                                  placeholder="e.g. Organization Name"
                                  fullWidth
                                />
                                <TextField
                                  label="Remarks"
                                  value={project.remarks}
                                  onChange={(event) => handleProjectChange(project.id, 'remarks', event.target.value)}
                                  placeholder="e.g. Additional notes"
                                  fullWidth
                                  multiline
                                  rows={3}
                                  sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </Box>
              )}

              {mainTab === 1 && detailTab === 9 && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Banking Information</Typography>
                        <Button variant="outlined" size="small" onClick={handleAddBankingInformationCard}>
                          Add More Banks
                        </Button>
                      </Box>
                      {bankingInformation.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No banking information added yet.</Typography>
                      ) : (
                        bankingInformation.map((bank, index) => (
                          <Card key={bank.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                            <CardContent>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                                Bank {index + 1}
                              </Typography>
                              {index > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    onClick={() => handleDeleteBankingInformation(bank.id)}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    Remove
                                  </Button>
                                </Box>
                              )}
                              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                                <TextField
                                  select
                                  label="Bank"
                                  value={bank.bank}
                                  onChange={(event) => handleBankingInformationChange(bank.id, 'bank', event.target.value)}
                                  placeholder="Select a bank"
                                  fullWidth
                                  disabled={banksLoading}
                                >
                                  <MenuItem value="">-- Select --</MenuItem>
                                  {banks
                                    .filter((b) => b.BankName?.trim())
                                    .map((b) => (
                                      <MenuItem key={b.BankId} value={String(b.BankId)}>
                                        {b.BankName?.trim()}
                                      </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                  label="Account Number"
                                  value={bank.accountNumber}
                                  onChange={(event) => handleBankingInformationChange(bank.id, 'accountNumber', event.target.value)}
                                  placeholder="e.g. 1234567890"
                                  fullWidth
                                />
                                <TextField
                                  label="Current Bank Balance"
                                  type="number"
                                  value={bank.currentBankBalance}
                                  onChange={(event) => handleBankingInformationChange(bank.id, 'currentBankBalance', event.target.value)}
                                  placeholder="e.g. 50000"
                                  fullWidth
                                />
                                <TextField
                                  label="Address of Bank"
                                  value={bank.addressOfBank}
                                  onChange={(event) => handleBankingInformationChange(bank.id, 'addressOfBank', event.target.value)}
                                  placeholder="e.g. Main Street, Downtown"
                                  fullWidth
                                  multiline
                                  rows={3}
                                  sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </Box>
              )}

              {mainTab === 1 && detailTab === 7 && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Trainings Received</Typography>
                        <Button variant="outlined" size="small" onClick={handleAddTrainingCard}>
                          Add More Training
                        </Button>
                      </Box>
                      {trainings.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No trainings added yet.</Typography>
                      ) : (
                        trainings.map((training, index) => (
                          <Card key={training.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                            <CardContent>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                                Training {index + 1}
                              </Typography>
                              {index > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    onClick={() => handleDeleteTraining(training.id)}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    Remove
                                  </Button>
                                </Box>
                              )}
                              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                                <TextField
                                  label="Year of Training"
                                  type="number"
                                  value={training.yearOfTraining}
                                  onChange={(event) => handleTrainingChange(training.id, 'yearOfTraining', event.target.value)}
                                  placeholder="e.g. 2023"
                                  fullWidth
                                />
                                <TextField
                                  label="Type of Training"
                                  value={training.typeOfTraining}
                                  onChange={(event) => handleTrainingChange(training.id, 'typeOfTraining', event.target.value)}
                                  placeholder="e.g. Financial Management"
                                  fullWidth
                                />
                                <TextField
                                  label="Duration"
                                  value={training.duration}
                                  onChange={(event) => handleTrainingChange(training.id, 'duration', event.target.value)}
                                  placeholder="e.g. 5 days"
                                  fullWidth
                                />
                                <TextField
                                  label="Supported By"
                                  value={training.supportedBy}
                                  onChange={(event) => handleTrainingChange(training.id, 'supportedBy', event.target.value)}
                                  placeholder="e.g. Organization Name"
                                  fullWidth
                                />
                                <TextField
                                  label="Number of Beneficiaries"
                                  type="number"
                                  value={training.numberOfBeneficiaries}
                                  onChange={(event) => handleTrainingChange(training.id, 'numberOfBeneficiaries', event.target.value)}
                                  placeholder="e.g. 25"
                                  fullWidth
                                  sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </Box>
              )}

              {mainTab === 1 && detailTab === 6 && (
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
                  {/* Background Details Card */}
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Background Details</Typography>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
                        {/* Year of Formation */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Year of Formation</Typography>
                          </Box>
                          <DatePicker
                            value={formData.backgroundYearOfFormation ? dayjs(formData.backgroundYearOfFormation) : null}
                            onChange={value => handleChange({ target: { name: 'backgroundYearOfFormation', value: value ? value.format('YYYY-MM-DD') : '' } })}
                            views={['year', 'month', 'day']}
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                          />
                        </Box>

                        {/* Membership by Gender (Initial) */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Initial Membership by Gender</Typography>
                            <Tooltip title="How many members were there when the group was formed initially">
                              <HelpOutlineIcon sx={{ fontSize: 16, color: '#667eea', cursor: 'pointer' }} />
                            </Tooltip>
                          </Box>
                          <TextField
                            value={formData.backgroundMembershipByGenderInitial || ''}
                            onChange={e => handleChange({ target: { name: 'backgroundMembershipByGenderInitial', value: e.target.value } })}
                            placeholder="e.g. Males: 10, Females: 15"
                            fullWidth
                            size="small"
                          />
                        </Box>

                        {/* Registration Authority */}
                        <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Registration Authority</Typography>
                            <Tooltip title="AG's Chambers or Cooperatives">
                              <HelpOutlineIcon sx={{ fontSize: 16, color: '#667eea', cursor: 'pointer' }} />
                            </Tooltip>
                          </Box>
                          <FormControl fullWidth>
                            <RadioGroup
                              name="backgroundRegistrationAuthority"
                              value={formData.backgroundRegistrationAuthority || ''}
                              onChange={handleChange}
                              sx={{ mt: 0.5 }}
                            >
                              <FormControlLabel value="AGsChambers" control={<Radio size="small" />} label="AG's Chambers" />
                              <FormControlLabel value="Cooperatives" control={<Radio size="small" />} label="Cooperatives" />
                            </RadioGroup>
                          </FormControl>
                        </Box>

                        {/* Membership by Gender (Current) */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Current Membership by Gender</Typography>
                            <Tooltip title="At present what is total membership by gender">
                              <HelpOutlineIcon sx={{ fontSize: 16, color: '#667eea', cursor: 'pointer' }} />
                            </Tooltip>
                          </Box>
                          <TextField
                            value={formData.backgroundMembershipByGenderCurrent || ''}
                            onChange={e => handleChange({ target: { name: 'backgroundMembershipByGenderCurrent', value: e.target.value } })}
                            placeholder="e.g. Males: 12, Females: 18"
                            fullWidth
                            size="small"
                          />
                        </Box>

                        {/* Dropouts Rate by Gender */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Dropouts Rate of Members by Gender</Typography>
                            <Tooltip title="How many members dropouts since formation">
                              <HelpOutlineIcon sx={{ fontSize: 16, color: '#667eea', cursor: 'pointer' }} />
                            </Tooltip>
                          </Box>
                          <TextField
                            value={formData.backgroundDropoutsRateByGender || ''}
                            onChange={e => handleChange({ target: { name: 'backgroundDropoutsRateByGender', value: e.target.value } })}
                            placeholder="e.g. Males: 2, Females: 1"
                            fullWidth
                            size="small"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Operations Card */}
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Operations</Typography>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
                        {/* Years of Operation */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Years of Operation</Typography>
                            <Tooltip title="Should be captured in the registration">
                              <HelpOutlineIcon sx={{ fontSize: 16, color: '#667eea', cursor: 'pointer' }} />
                            </Tooltip>
                          </Box>
                          <TextField
                            value={formData.operationsYearsOfOperation || ''}
                            onChange={e => handleChange({ target: { name: 'operationsYearsOfOperation', value: e.target.value } })}
                            placeholder="e.g. 5 years"
                            fullWidth
                            size="small"
                          />
                        </Box>

                        {/* Profit Margin */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Profit Margin</Typography>
                            <Tooltip title="The total profit from the 3 activities divided by 3">
                              <HelpOutlineIcon sx={{ fontSize: 16, color: '#667eea', cursor: 'pointer' }} />
                            </Tooltip>
                          </Box>
                          <TextField
                            value={formData.operationsProfitMargin || ''}
                            onChange={e => handleChange({ target: { name: 'operationsProfitMargin', value: e.target.value } })}
                            placeholder="e.g. 15%"
                            fullWidth
                            size="small"
                          />
                        </Box>

                        {/* Records Maintenance */}
                        <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Records Maintenance</Typography>
                            <Tooltip title="How do they keep records and in what language">
                              <HelpOutlineIcon sx={{ fontSize: 16, color: '#667eea', cursor: 'pointer' }} />
                            </Tooltip>
                          </Box>
                          <TextField
                            value={formData.operationsRecordsMaintenance || ''}
                            onChange={e => handleChange({ target: { name: 'operationsRecordsMaintenance', value: e.target.value } })}
                            placeholder="e.g. Digital records in English"
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                          />
                        </Box>

                        {/* Proximity of group to end borrowers */}
                        <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Proximity of Group to End Borrowers</Typography>
                            <Tooltip title="Select the location relationship of the group to end borrowers">
                              <HelpOutlineIcon sx={{ fontSize: 16, color: '#667eea', cursor: 'pointer' }} />
                            </Tooltip>
                          </Box>
                          <FormControl fullWidth>
                            <TextField
                              select
                              value={formData.operationsProximityToEndBorrowers || ''}
                              onChange={handleChange}
                              name="operationsProximityToEndBorrowers"
                              size="small"
                            >
                              <MenuItem value="">-- Select --</MenuItem>
                              <MenuItem value="SameCommunity">If in the same community</MenuItem>
                              <MenuItem value="OutsideCommunity">If members are from outside the community</MenuItem>
                              <MenuItem value="NewOrganization">If group is a new organization</MenuItem>
                            </TextField>
                          </FormControl>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}


              {/* Removed fallback message for unimplemented tabs */}
            </CardContent>
          </Card>

          <Box sx={{ mt: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <FormControlLabel
              control={<Checkbox name="printReceipt" checked={formData.printReceipt} onChange={handleChange} />}
              label="Print receipt after saving"
              sx={{ '& .MuiTypography-root': { fontSize: '0.95rem' }, pt: 1 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isSaving || isExistingMember}
              sx={{
                backgroundColor: '#667eea',
                '&:hover': { backgroundColor: '#5568d3' },
                fontWeight: 600,
                paddingX: 3,
                boxShadow: 'none',
                textTransform: 'none',
              }}
            >
              {isSaving ? 'Saving...' : '💾 Save'}
            </Button>
            {isExistingMember && mainTab === 0 && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleUpdateCustomer}
                disabled={isSaving}
                sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#276c2a' }, fontWeight: 600, paddingX: 3 }}
              >
                {isSaving ? (mainTab === 0 ? 'Updating...' : 'Updating...') : '🔄 Update Customer'}
              </Button>
            )}
            {isExistingMember && mainTab === 1 && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleUpdateInstitution}
                disabled={isSaving}
                sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#276c2a' }, fontWeight: 600, paddingX: 3 }}
              >
                {isSaving ? 'Updating...' : '🔄 Update Institution'}
              </Button>
            )}
            <Button variant="outlined" onClick={handlePrintReceipt}>
              🖨️ Print Receipt
            </Button>
          </Box>
        </Box>
      )}

      {/* Post-save confirmation: let the user choose to start a new registration or keep reviewing the saved data */}
      <Dialog
        open={Boolean(pendingFormReset)}
        onClose={() => setPendingFormReset(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Registration Saved</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Would you like to start a new registration, or keep this data on screen to review or print?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingFormReset(null)}>Keep Data</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (pendingFormReset === 'individual') resetIndividualForm();
              if (pendingFormReset === 'institution') resetInstitutionForm();
              setPendingFormReset(null);
            }}
          >
            Start New Registration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expanded Image Modal */}
      <Dialog
        open={expandedImageOpen}
        onClose={() => setExpandedImageOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
            maxHeight: '95vh',
          },
        }}
      >
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, height: '90vh' }}>
          <Box
            component="img"
            src={expandedImageUrl}
            alt="Expanded preview"
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, textAlign: 'center', maxWidth: '100%' }}
          >
            Click outside to close or press Escape
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
