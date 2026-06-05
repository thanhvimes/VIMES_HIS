#include "HMSRegistration.h"
//#include "stdafx.h"
#include "MainFrm.h"
#include "resource.h"
#include "HMSCardEntryDialog.h"
#include "StringToken.h"
#include "HMSPriorityDialog.h"
#include "ReportDocument.h"
#include "HMSFunctionalTestDialog.h"
#include "HMSInsregDateDialog.h"
#include "HMSAdditionCardDialog.h"
#include "HMSInsuranceCardSettingDialog.h"
#include "HeathExamDialog.h"
#include "HMSSearchPatientInformation.h"
#include "RMCanCuocCDDlg.h"

#include <afxinet.h>
#include "json.h"
#include "stdafx.h"
#include <iostream>     // std::cout
#include <sstream>      // std::istringstream
#include <string>       // std::string
static BOOL wndIcdShow = FALSE, wndDiseaseShow = FALSE;
static BOOL wndFindName = FALSE, wndFindCard = FALSE;
static int CheckInsQtyExamed(int nRoomId)
{
	CMainFrame* pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL;
	szSQL.Format(_T("select count(*) ") \
				_T(" from hms_exam ") \
				_T(" left join hms_doc on (hd_docno = he_docno) ") \
				_T(" left join hms_object on (ho_id = hd_object) ") \
				_T(" where DATE(he_examdate) = current_date and he_roomid = %d and ho_type = 'I' and he_status <> 'C'"), nRoomId);
	rs.ExecSQL(szSQL);
	if (rs.GetIntValue() > 65)
	{
		return -1;
	}
	return 0;
}

bool ParseInsuranceCardInfo(CString szCardInfo, CStringArray& arInfo)
{
	CString szCard;
	szCard.Empty();
	for(int i =0; i < szCardInfo.GetLength(); i++){
		if(_istalnum(szCardInfo[i]) || szCardInfo[i] == _T('|') || szCardInfo[i] == _T('/'))
		{
			szCard += szCardInfo[i];
		}
	}
//_tprintf(_T("\r\n%s"), szCard);
	CStringToken tk(szCard, _T("|"), false);
	CString tmpStr;
	CString szText;

	int code_page = CP_UTF8;
	for (int i =0; i < tk.GetSize(); i++)
	{
		tk.GetAt(i, tmpStr);
		_tprintf(_T("\r\n%d: %s"), i, tmpStr);
		tmpStr.Trim();
		if(i == 1 || i == 4 || (i == 14 && tk.GetSize() == 15))
		{
			szText.Empty();
			std::string str;
			std::wstring wstr;
			for (int j = 0; j < tmpStr.GetLength(); j += 2)
			{
				CString hex = tmpStr.Mid(j, 2);
				if(hex == _T("00"))
				{
					hex = tmpStr.Mid(j, 4);
					j+= 2;
					code_page = CP_ACP;
					std::wstringstream iss((LPCTSTR)hex);
					int temp;
					iss >> std::hex >> temp;
					wstr += static_cast<wchar_t>(temp);
				}
				else
				{
					std::wstringstream iss((LPCTSTR)hex);
					int temp;
					iss >> std::hex >> temp;
					str += static_cast<char>(temp);
				}
				
			}

			if(code_page == CP_UTF8)
			{
				WCHAR szBuffer[254];
				memset(szBuffer, _T('\0'), 254);
				::MultiByteToWideChar(code_page, 0, str.c_str(), str.length(), szBuffer, str.length());
				arInfo.Add(szBuffer);
			}
			else
			{
				arInfo.Add(wstr.c_str());
			}
				
		}
		else
			arInfo.Add(tmpStr);
		
		
	}
	return true;
}

static int _OnRoomListLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnRoomListLoadData();
} 
static int _OnRoomListDblClickFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnRoomListDblClick();
} 
static int _OnRoomListSelectChangeFnc(CWnd *pWnd, int nOldItem, int nNewItem){
	 return ((CHMSRegistration*)pWnd)->OnRoomListSelectChange(nOldItem, nNewItem);
} 
static int _OnRoomListDeleteItemFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnRoomListDeleteItem();
} 
static long _OnExamListLoadDataFnc(CWnd *pWnd){
	return ((CHMSRegistration*)pWnd)->OnExamListLoadData();
} 
static void _OnExamListDblClickFnc(CWnd *pWnd){
	((CHMSRegistration*)pWnd)->OnExamListDblClick();
} 
static void _OnExamListSelectChangeFnc(CWnd *pWnd, int nOldItem, int nNewItem){
	((CHMSRegistration*)pWnd)->OnExamListSelectChange(nOldItem, nNewItem);
} 
static int _OnExamListDeleteItemFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnExamListDeleteItem();
} 
static int _OnExamListSetPriorityFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnExamListSetPriority();
} 
/*static void _OnPatientNoChangeFnc(CWnd *pWnd){
	((CHMSRegistration *)pWnd)->OnPatientNoChange();
} */
/*static int _OnPatientNoSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnPatientNoKillfocus();} */ 
/*static int _OnPatientNoKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnPatientNoKillfocus();
} */
static int _OnPatientNoCheckValueFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnPatientNoCheckValue();
} 
/*static int _OnDocumentNoChangeFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnDocumentNoChange();
} */
static int _OnDocumentNoSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnDocumentNoSetfocus();
} 
/*static int _OnDocumentNoKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnDocumentNoKillfocus();
} */
static int _OnDocumentNoCheckValueFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnDocumentNoCheckValue();
} 
/*static int _OnCardNoFindChangeFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnCardNoFindChange();
} */
/*static int _OnCardNoFindSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnCardNoFindKillfocus();} */ 
/*static int _OnCardNoFindKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnCardNoFindKillfocus();
} */
static int _OnCardNoFindCheckValueFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnCardNoFindCheckValue();
} 
/*static int _OnPatientNameChangeFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnPatientNameChange();
} */
/*static int _OnPatientNameSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnPatientNameKillfocus();} */ 
/*static int _OnPatientNameKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnPatientNameKillfocus();
} */
static int _OnPatientNameCheckValueFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnPatientNameCheckValue();
} 
/*static int _OnAgeChangeFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnAgeChange();
} */
/*static int _OnAgeSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnAgeKillfocus();} */ 
/*static int _OnAgeKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnAgeKillfocus();
} */
static int _OnAgeCheckValueFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnAgeCheckValue();
} 
/*static int _OnBirthDateChangeFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnBirthDateChange();
} */
/*static int _OnBirthDateSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnBirthDateKillfocus();} */ 
/*static int _OnBirthDateKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnBirthDateKillfocus();
} */
static int _OnBirthDateCheckValueFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnBirthDateCheckValue();
} 
static int _OnSexSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnSexSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnSexSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnSexSelendok();
}
/*static int _OnSexSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnSexKillfocus();
}*/
/*static int _OnSexKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnSexKillfocus();
}*/
static int _OnSexLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnSexLoadData();
}
/*static int _OnSexAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnSexAddNew();
}*/
static int _OnEthnicSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnEthnicSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnEthnicSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnEthnicSelendok();
}
/*static int _OnEthnicSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnEthnicKillfocus();
}*/
/*static int _OnEthnicKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnEthnicKillfocus();
}*/
static int _OnEthnicLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnEthnicLoadData();
}
/*static int _OnEthnicAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnEthnicAddNew();
}*/
static int _OnOccupationSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnOccupationSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnOccupationSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnOccupationSelendok();
}
/*static int _OnOccupationSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnOccupationKillfocus();
}*/
/*static int _OnOccupationKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnOccupationKillfocus();
}*/
static int _OnOccupationLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnOccupationLoadData();
}
/*static int _OnOccupationAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnOccupationAddNew();
}*/
static int _OnProvillSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnProvillSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnProvillSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnProvillSelendok();
}
/*static int _OnProvillSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnProvillSetfocus();
}*/

static int _OnProvillKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnProvillKillfocus();
}
static int _OnProvillLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnProvillLoadData();
}
/*static int _OnProvillAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnProvillAddNew();
}*/

static int _OnDistrictSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnDistrictSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnDistrictSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnDistrictSelendok();
}

static int _OnDistrictSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnDistrictKillfocus();
}

/*static int _OnDistrictKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnDistrictSetfocus();
}*/
static int _OnDistrictLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnDistrictLoadData();
}
/*static int _OnDistrictAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnDistrictAddNew();
}*/

static int _OnVillageSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnVillageSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnVillageSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnVillageSelendok();
}
/*static int _OnVillageSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnVillageKillfocus();
}*/
/*static int _OnVillageKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnVillageKillfocus();
}*/
static int _OnVillageLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnVillageLoadData();
}
/*static int _OnVillageAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnVillageAddNew();
}*/


static int _OnAddressSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnAddressSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnAddressSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnAddressSelendok();
}
/*static int _OnAddressSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnAddressKillfocus();
}*/
/*static int _OnAddressKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnAddressKillfocus();
}*/
static int _OnAddressLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnAddressLoadData();
}
/*static int _OnAddressAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnAddressAddNew();
}*/
/*static int _OnDetailAddressChangeFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnDetailAddressChange();
} */
/*static int _OnDetailAddressSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnDetailAddressKillfocus();} */ 
/*static int _OnDetailAddressKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnDetailAddressKillfocus();
} */
static int _OnDetailAddressCheckValueFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnDetailAddressCheckValue();
} 
/*static int _OnWorkingPlaceChangeFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnWorkingPlaceChange();
} */
/*static int _OnWorkingPlaceSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnWorkingPlaceKillfocus();} */ 
/*static int _OnWorkingPlaceKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnWorkingPlaceKillfocus();
} */
static int _OnWorkingPlaceCheckValueFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnWorkingPlaceCheckValue();
} 
static int _OnIntroductionSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnIntroductionSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnIntroductionSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnIntroductionSelendok();
}
/*static int _OnIntroductionSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnIntroductionKillfocus();
}*/
/*static int _OnIntroductionKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnIntroductionKillfocus();
}*/
static int _OnIntroductionLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnIntroductionLoadData();
}
/*static int _OnIntroductionAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnIntroductionAddNew();
}*/
static int _OnPositionSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnPositionSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnPositionSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPositionSelendok();
}
/*static int _OnPositionSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPositionKillfocus();
}*/
/*static int _OnPositionKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPositionKillfocus();
}*/
static int _OnPositionLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPositionLoadData();
}
/*static int _OnPositionAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPositionAddNew();
}*/
/*static int _OnPhoneChangeFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnPhoneChange();
} */
/*static int _OnPhoneSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnPhoneKillfocus();} */ 
/*static int _OnPhoneKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnPhoneKillfocus();
} */
static int _OnPhoneCheckValueFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnPhoneCheckValue();
} 
static int _OnObjectSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnObjectSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnObjectSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnObjectSelendok();
}
/*static int _OnObjectSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnObjectKillfocus();
}*/
/*static int _OnObjectKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnObjectKillfocus();
}*/
static int _OnObjectLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnObjectLoadData();
}
/*static int _OnObjectAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnObjectAddNew();
}*/


static int _OnPatientNameFindSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnPatientNameFindSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnPatientNameFindSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPatientNameFindSelendok();
}
/*static int _OnPatientNameFindSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPatientNameFindKillfocus();
}*/
/*static int _OnPatientNameFindKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPatientNameFindKillfocus();
}*/
static int _OnPatientNameFindLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPatientNameFindLoadData();
}
/*static int _OnPatientNameFindAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPatientNameFindAddNew();
}*/

/*static int _OnCardNoChangeFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnCardNoChange();
} */
/*static int _OnCardNoSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnCardNoKillfocus();} */ 
/*static int _OnCardNoKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnCardNoKillfocus();
} */
static int _OnCardNoCheckValueFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnCardNoCheckValue();
} 
static int _OnCardNoButtonSelectFnc(CWnd *pWnd){
	CHMSRegistration *pVw = (CHMSRegistration *)pWnd;
	return pVw->OnCardNoButtonSelect();
} 
static int _OnPatientStateSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnPatientStateSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnPatientStateSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPatientStateSelendok();
}
/*static int _OnPatientStateSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPatientStateKillfocus();
}*/
/*static int _OnPatientStateKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPatientStateKillfocus();
}*/
static int _OnPatientStateLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPatientStateLoadData();
}
/*static int _OnPatientStateAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnPatientStateAddNew();
}*/
/*static int _OnExamDateChangeFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnExamDateChange();
} */
/*static int _OnExamDateSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnExamDateKillfocus();} */ 
/*static int _OnExamDateKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnExamDateKillfocus();
} */
static int _OnExamDateCheckValueFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnExamDateCheckValue();
} 
static int _OnExamTypeSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnExamTypeSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnExamTypeSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnExamTypeSelendok();
}
/*static int _OnExamTypeSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnExamTypeKillfocus();
}*/
/*static int _OnExamTypeKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnExamTypeKillfocus();
}*/
static int _OnExamTypeLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnExamTypeLoadData();
}
/*static int _OnExamTypeAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnExamTypeAddNew();
}*/
static int _OnRoomSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnRoomSelectChange(nOldItemSel, nNewItemSel);
} 
static int _OnRoomSelendokFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnRoomSelendok();
}
/*static int _OnRoomSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnRoomKillfocus();
}*/
/*static int _OnRoomKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnRoomKillfocus();
}*/
static int _OnRoomLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnRoomLoadData();
}
/*static int _OnRoomAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnRoomAddNew();
}*/
/*static int _OnHospitalChangeFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnHospitalChange();
} */
/*static int _OnHospitalSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnHospitalKillfocus();} */ 
/*static int _OnHospitalKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnHospitalKillfocus();
} */
//static int _OnHospitalCheckValueFnc(CWnd *pWnd){
//	return ((CHMSRegistration *)pWnd)->OnHospitalCheckValue();
//} 

static void _OnDiseaseBtnSelectFnc(CWnd *pWnd){
	CHMSRegistration *pVw = (CHMSRegistration *)pWnd;
	pVw->OnDiseaseBtnSelect();
} 

static int _OnHospitalSelectChangeFnc(CWnd *pWnd, int nOldItemSel, int nNewItemSel){
	 return ((CHMSRegistration* )pWnd)->OnHospitalSelectChange(nOldItemSel, nNewItemSel);
} 
//static int _OnHospitalSelendokFnc(CWnd *pWnd){
	// return ((CHMSRegistration *)pWnd)->OnHospitalSelendok();
//}
/*static int _OnHospitalSetfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnHospitalKillfocus();
}*/
/*static int _OnHospitalKillfocusFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnHospitalKillfocus();
}*/
static int _OnHospitalLoadDataFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnHospitalLoadData();
}
/*static int _OnHospitalAddNewFnc(CWnd *pWnd){
	 return ((CHMSRegistration *)pWnd)->OnHospitalAddNew();
}*/

/*static int _OnDiseaseChangeFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnDiseaseChange();
} */
/*static int _OnDiseaseSetfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnDiseaseKillfocus();} */ 
/*static int _OnDiseaseKillfocusFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnDiseaseKillfocus();
} */
static int _OnDiseaseCheckValueFnc(CWnd *pWnd){
	return ((CHMSRegistration *)pWnd)->OnDiseaseCheckValue();
} 

static int _OnNationalitySelectFnc(CWnd *pWnd){	
	return ((CHMSRegistration *)pWnd)->OnNationalityCheckValue();
} 

static int _OnAddNewSelectFnc(CWnd *pWnd){
	CHMSRegistration *pVw = (CHMSRegistration *)pWnd;
	return pVw->OnAddNewSelect();
} 
static int _OnEditSelectFnc(CWnd *pWnd){
	CHMSRegistration *pVw = (CHMSRegistration *)pWnd;
	return pVw->OnEditSelect();
} 

static int _OnDeleteSelectFnc(CWnd *pWnd){
	CHMSRegistration *pVw = (CHMSRegistration *)pWnd;
	return pVw->OnDeleteSelect();
} 

static int _OnSaveSelectFnc(CWnd *pWnd){
	CHMSRegistration *pVw = (CHMSRegistration *)pWnd;
	return pVw->OnSaveSelect();
} 
static int _OnCancelSelectFnc(CWnd *pWnd){
	CHMSRegistration *pVw = (CHMSRegistration *)pWnd;
	return pVw->OnCancelSelect();
} 
static int _OnPrintSelectFnc(CWnd *pWnd){
	CHMSRegistration *pVw = (CHMSRegistration *)pWnd;
	return pVw->OnPrintSelect();
}

static int _OnIntroductionSelectFnc(CWnd *pWnd){
	CHMSRegistration *pVw = (CHMSRegistration *)pWnd;
	return pVw->OnIntroductionSelect();
} 

static int _OnThemDVSelectFnc(CWnd *pWnd){
	CHMSRegistration *pVw = (CHMSRegistration *)pWnd;
	return pVw->OnThemDVSelect();
} 
static int _OnAddHMSRegistrationFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnAddHMSRegistration();
} 
static int _OnEditHMSRegistrationFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnEditHMSRegistration();
} 
static int _OnEditCardInformationFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnEditCardInformation();
} 
static int _OnAddAdditionalCardFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnAddAdditionalCard();
} 

static int _OnIgnoreTransferredInfoFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnIgnoreTransferredInfo();
} 

static int _OnDeleteHMSRegistrationFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnDeleteHMSRegistration();
} 
static int _OnSaveHMSRegistrationFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnSaveHMSRegistration();
} 
static int _OnCancelHMSRegistrationFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnCancelHMSRegistration();
} 

static int _OnCapturePatientFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnCapturePatient();
} 


static int _OnFunctionalTestFnc(CWnd *pWnd){
	 ((CHMSRegistration*)pWnd)->OnFunctionalTest();
	 return 0;
}

static int _OnKhamsankhoaFnc(CWnd *pWnd){
	 ((CHMSRegistration*)pWnd)->OnKhamsankhoa();
	 return 0;
} 

static int _OnKhamsuckhoeFnc(CWnd *pWnd){
	 ((CHMSRegistration*)pWnd)->OnKhamsuckhoe();
	 return 0;
} 

static int _OnAddNewDocumentFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnAddNewDocument();
} 

static int _OnAddNewReceptionFnc(CWnd *pWnd){
	return ((CHMSRegistration*)pWnd)->OnAddNewReception();
} 

static int _OnPrintReceptionFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnPrintSelect();
} 
static int _OnPrintYCSDDVFnc(CWnd *pWnd){
	 return ((CHMSRegistration*)pWnd)->OnPrintYCSDDVSelect();
}

CHMSRegistration::CHMSRegistration(){
	SetDefaultValues();
	m_rsAddress = NULL;
	m_szOffLine = _T("N");
	m_nPatientNo=0;
	m_nDocumentNo=0;
	m_bHaveAdditionalCard = false;
	m_bCheckBarcode = false;
}
CHMSRegistration::~CHMSRegistration(){
	if(m_rsAddress) delete m_rsAddress;
}
void CHMSRegistration::OnCreateComponents(){	
	m_wndProfiles.Create(this, _T("Profiles"), 5, 5, 705, 240);
	m_wndPatientObject.Create(this, _T("Patient Object"), 6, 245, 705, 300);
	m_wndExaminationInformation.Create(this, _T("Examination Information"), 5, 305, 705, 420);
	m_wndRoomsInformation.Create(this, _T("Rooms Information"), 710, 5, 1010, 630);
	m_wndExaminationList.Create(this, _T("Examination History"), 5, 425, 705, 575);
	m_wndRoomList.Create(this,715, 30, 1005, 420); 
	m_wndExamList.Create(this,10, 450, 700, 570); 
	m_wndPatientNoLabel.Create(this, _T("PID"), 10, 30, 110, 55);
	m_wndPatientNo.Create(this,115, 30, 200, 55); 
	m_wndDocumentNoLabel.Create(this, _T("Document No"), 205, 30, 280, 55);
	m_wndDocumentNo.Create(this,285, 30, 370, 55); 	
	m_wndCardNoFindLabel.Create(this, _T("Card"), 375, 30, 475, 55);
	m_wndCardNoFind.Create(this,480, 30, 700, 55);	
	m_wndPatientNameFindLabel.Create(this, _T("Tên"), 375, 30, 475, 55);
	m_wndPatientNameFind.Create(this,480, 30, 700, 55); 	
	m_wndPatientNameLabel.Create(this, _T("Patient Name"), 10, 60, 110, 85);
	m_wndPatientName.Create(this,115, 60, 370, 85); 
	m_wndAgeLabel.Create(this, _T("Age"), 375, 60, 475, 85);
	m_wndAge.Create(this,480, 60, 585, 85); 
	m_wndBirthDate.Create(this,590, 60, 675, 85); 
	m_wndYearofBirth.Create(this, _T(""), 680, 60, 700, 85);
	m_wndSexLabel.Create(this, _T("Sex"), 10, 90, 110, 115);
	m_wndSex.Create(this,115, 90, 200, 115); 
	m_wndEthnicLabel.Create(this, _T("Ethnic"), 205, 90, 280, 115);
	m_wndEthnic.Create(this,285, 90, 370, 115); 
	m_wndOccupationLabel.Create(this, _T("Occupation"), 375, 90, 475, 115);
	m_wndOccupation.Create(this,480, 90, 700, 115); 
	m_wndProvillLabel.Create(this, _T("Provill"), 10, 120, 110, 145);
	m_wndProvill.Create(this,115, 120, 370, 145);
	m_wndVillageLabel.Create(this, _T("Village"), 375, 120, 475, 145);
	m_wndVillage.Create(this,480, 120, 700, 145);
	m_wndDetailAddressLabel.Create(this, _T("Detail Address"), 10, 150, 110, 175);
	m_wndDetailAddress.Create(this,115, 150, 700, 175);
	m_wndPhoneLabel.Create(this, _T("Số điện thoại"), 10, 180, 110, 205);
	m_wndPhone.Create(this, 115, 180, 370, 205);
	m_wndIntroductionLabel.Create(this, _T("Người GT"), 375, 180, 475, 205);
	m_wndIntroduction.Create(this,480, 180, 700, 205); 

	m_wndCMNDLabel.Create(this, _T("Thẻ căn cước"), 10, 210, 110, 235);
	m_wndCMND.Create(this,115, 210, 270, 235);	
	m_wndNgaycapCMND.Create(this,275, 210, 370, 235);
	m_wndRelativeLabel.Create(this, _T("Relative"), 375, 210, 475, 235);
	m_wndRelative.Create(this,480, 210, 700, 235); 
	m_wndObjectLabel.Create(this, _T("Object"), 10, 270, 110, 295);
	m_wndObject.Create(this,115, 270, 370, 295); 
	m_wndCardNoLabel.Create(this, _T("Card No"), 375, 270, 475, 295);
	m_wndCardNo.Create(this,480, 270, 670, 295); 
	m_wndCardNoButton.Create(this, _T("@"), 675, 270, 700, 295);
	m_wndPatientStateLabel.Create(this, _T("Patient State"), 10, 330, 110, 355);
	m_wndPatientState.Create(this,115, 330, 370, 355); 
	m_wndExamDateLabel.Create(this, _T("Date"), 375, 330, 475, 355);
	m_wndExamDate.Create(this,480, 330, 580, 355); 
	m_wndSheetNoLabel.Create(this, _T("Sheet No"), 585, 330, 655, 355);
	m_wndSheetNo.Create(this,660, 330, 700, 355); 
	m_wndExamTypeLabel.Create(this, _T("Exam Type"), 10, 360, 110, 385);
	m_wndExamType.Create(this,115, 360, 370, 385); 
	m_wndRoomLabel.Create(this, _T("Room"), 375, 360, 475, 385);
	m_wndRoom.Create(this,480, 360, 700, 385); 
	m_wndDiseaseLabel.Create(this, _T("Symptoms"), 10, 390, 110, 415);
	m_wndDisease.Create(this,115, 390, 700, 415); 
	m_wndDiseaseBtn.Create(this, _T("..."), 660, 390, 685, 415);
	m_wndExaminePerWeekLabel.Create(this, _T("Examine Per Week"), 15, 610, 195, 635);
	m_wndExaminePerWeek.Create(this,200, 610, 290, 635); 
	m_wndExaminePerMonthLabel.Create(this, _T("Examine Per Month"), 295, 610, 470, 635);
	m_wndExaminePerMonth.Create(this,475, 610, 585, 635); 
	m_wndNationality.Create(this, _T("Nationality"), 300, 425, 515, 450);
	m_wndAppointReexamine.Create(this, _T("Appoint Re-examine"), 520, 425, 700, 450);
	m_wndAddNew.Create(this, _T("&Add"), 15, 580, 125, 605);
	m_wndEdit.Create(this, _T("&Edit"), 130, 580, 240, 605);
	m_wndDelete.Create(this, _T("&Delete"), 245, 580, 355, 605);
	m_wndSave.Create(this, _T("&Save"), 360, 580, 470, 605);
	m_wndCancel.Create(this, _T("&Cancel"), 475, 580, 585, 605);
	m_wndPrint.Create(this, _T("&Print"), 590, 580, 700, 605);
	m_wndThemDV.Create(this, _T("&Thêm dịch vụ"), 590, 610, 700, 635);	
	
	m_wndCallProcessing.Create(this, CRect(705, 420, 1000, 630));
	m_wndPatientImg.Create(this, 715, 420, 1005, 630);	
}
void CHMSRegistration::OnInitializeComponents(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	SetMode(VM_NONE);
	m_wndPatientNo.SetLimitText(9);
	m_wndPatientNo.SetCheckValue(true);
	m_wndPatientNo.SetNotEmpty(false);
	m_wndDocumentNo.SetLimitText(9);
	m_wndDocumentNo.SetCheckValue(true);
	m_wndDocumentNo.SetNotEmpty(false);
	
	if(pMF->m_bQRCode)
		m_wndCardNoFind.SetLimitText(512);
	else
		m_wndCardNoFind.SetLimitText(20);

	pMF->m_szHrUseKiot = _T("Y");

	if(pMF->m_szHrUseKiot == _T("Y"))
	{
		m_wndPatientImg.ShowWindow(SW_HIDE);
	}
	else
	{
		m_wndCallProcessing.ShowWindow(SW_HIDE);
	}

	m_wndCardNoFind.SetCheckValue(true);
	m_wndCardNoFind.SetNotEmpty(false);
	m_wndCardNoFind.ModifyStyle(0, ES_UPPERCASE);
	m_wndPatientName.SetLimitText(65);
	
	m_wndPatientName.SetCheckValue(true);
	m_wndPatientName.SetInitCap(true);
	if(pMF->m_szPatientNameUpper == _T("Y")){
		m_wndPatientName.ModifyStyle(0, ES_UPPERCASE);
	}
	
	m_wndAge.SetLimitText(8);
	m_wndAge.SetCheckValue(true);
	m_wndBirthDate.SetReadOnly(true);
	m_wndSex.SetCheckValue(true);
	m_wndSex.LimitText(5);

	m_wndEthnic.SetCheckValue(true);
	m_wndEthnic.LimitText(15);
	m_wndOccupation.SetCheckValue(true);
	m_wndOccupation.LimitText(15);

	m_wndCMND.SetLimitText(12);
	m_wndPhone.SetLimitText(11);

	m_wndYearofBirth.ModifyStyle(WS_TABSTOP, 0);


	m_wndIntroductionLabel.SetHyperlink(true);
	m_wndIntroductionLabel.SetEvent(WE_CLICK, _OnIntroductionSelectFnc);

	m_wndProvill.SetSearchStyle(SS_LIKE);
	m_wndProvill.LimitText(254);

	//m_wndDistrict.SetSearchStyle(SS_LIKE);
	//m_wndDistrict.LimitText(254);
	
	m_wndVillage.SetSearchStyle(SS_LIKE);
	m_wndVillage.LimitText(254);

	m_wndProvill.SetCheckValue(true);
	m_wndDistrict.SetCheckValue(true);

	m_wndDetailAddress.SetLimitText(254);
//	m_wndDetailAddress.SetCheckValue(true);
	m_wndWorkingPlace.SetLimitText(254);
//	m_wndWorkingPlace.SetCheckValue(true);
//	m_wndPosition.SetCheckValue(true);
	m_wndPosition.LimitText(35);
	m_wndPhone.SetLimitText(13);
//	m_wndPhone.SetCheckValue(true);
	m_wndObject.SetCheckValue(true);
	m_wndObject.LimitText(15);
	m_wndCardNo.SetLimitText(25);
	m_wndCardNo.ModifyStyle(0, ES_UPPERCASE);
	m_wndCardNo.SetReadOnly(true);
	m_wndPatientState.SetCheckValue(true);
	m_wndPatientState.LimitText(15);
//	m_wndExamDate.SetMax(CDate(pMF->GetSysDateTime()));
	m_wndExamDate.SetCheckValue(true);
//	m_wndExamDate.SetReadOnly(true);
	m_wndExamDate.ModifyStyle(WS_TABSTOP, 0);
	m_wndExamType.SetCheckValue(true);
	m_wndExamType.LimitText(15);
	m_wndRoom.SetCheckValue(true);
	m_wndRoom.LimitText(15);
	m_wndSheetNo.SetReadOnly(true);
	m_wndSheetNo.ModifyStyle(0, ES_RIGHT);
	m_wndLabelTitle.ModifyStyle(0, ES_CENTER);
	m_wndExaminePerWeek.SetReadOnly(true);
	m_wndExaminePerMonth.SetReadOnly(true);
	m_wndAppointReexamine.ModifyStyle(WS_TABSTOP, 0);
	m_wndAppointReexamineDate.SetReadOnly(true);

	m_wndPatientNameFind.SetSearchStyle(SS_LIKE);
	m_wndPatientNameFind.SetSearchEx(true);	

	if(pMF->m_szObjectInsurance == _T("Y"))
	{
		m_wndCardNoFindLabel.ShowWindow(TRUE);
		m_wndCardNoFind.ShowWindow(TRUE);
		m_wndPatientNameFindLabel.ShowWindow(FALSE);
		m_wndPatientNameFind.ShowWindow(FALSE);
	}
	else if(pMF->m_bQRCode)
	{
		m_wndCardNoFindLabel.ShowWindow(TRUE);
		m_wndCardNoFind.ShowWindow(TRUE);
		m_wndPatientNameFindLabel.ShowWindow(FALSE);
		m_wndPatientNameFind.ShowWindow(FALSE);
	}
	else
	{

		m_wndCardNoFindLabel.ShowWindow(FALSE);
		m_wndCardNoFind.ShowWindow(FALSE);
		m_wndPatientNameFindLabel.ShowWindow(TRUE);
		m_wndPatientNameFind.ShowWindow(TRUE);

		m_wndEthnic.SetCheckValue(false);		
		m_wndOccupation.SetCheckValue(false);
	}


	m_wndProvill.InsertColumn(0, _T("ID"), CFMT_NUMBER, 50);
	m_wndProvill.InsertColumn(1, _T("Name"), CFMT_TEXT, 250);
	m_wndProvill.InsertColumn(2, _T("Shortcut"), CFMT_TEXT, 70);

	m_wndDistrict.InsertColumn(0, _T("ID"), CFMT_NUMBER, 50);
	m_wndDistrict.InsertColumn(1, _T("Name"), CFMT_TEXT, 250);
	m_wndDistrict.InsertColumn(2, _T("Code"), CFMT_TEXT, 50);

	m_wndVillage.InsertColumn(0, _T("ID"), CFMT_NUMBER, 70);
	m_wndVillage.InsertColumn(1, _T("Name"), CFMT_TEXT, 250);
	m_wndVillage.InsertColumn(2, _T("Code"), CFMT_TEXT, 70);


	m_wndDiseaseBtn.ShowWindow(SW_HIDE);

	m_wndRoomList.InsertColumn(0, _T("Room"), CFMT_TEXT, 140);
	m_wndRoomList.InsertColumn(1, _T("Tổng"), CFMT_NUMBER, 50);
	m_wndRoomList.InsertColumn(2, _T("BH"), CFMT_NUMBER, 50);
	m_wndRoomList.InsertColumn(3, _T("Đã khám"), CFMT_NUMBER, 50);
	m_wndRoomList.ModifyStyle(0, LVS_NOSORTHEADER);

	m_wndExamList.InsertColumn(0, _T("Số HS"), CFMT_NUMBER, 75);
	m_wndExamList.InsertColumn(1, _T("Examination Date"), CFMT_DATE, 90);
	m_wndExamList.InsertColumn(2, _T("Examination Room"), CFMT_TEXT, 150);
	m_wndExamList.InsertColumn(3, _T("Sheet No"), CFMT_NUMBER, 60);
	m_wndExamList.InsertColumn(4, _T("Doctor"), CFMT_TEXT, 80);
	m_wndExamList.InsertColumn(5, _T("Status"), CFMT_TEXT, 80);
	m_wndExamList.InsertColumn(6, _T("Recept Idx"), CFMT_TEXT, 0);
	m_wndExamList.InsertColumn(7, _T("Diagnostic"), CFMT_TEXT, 150);


	m_wndSex.InsertColumn(0, _T("ID"), CFMT_TEXT, 50);
	m_wndSex.InsertColumn(1, _T("Name"), CFMT_TEXT, 180);


	m_wndEthnic.InsertColumn(0, _T("ID"), CFMT_NUMBER, 50);
	m_wndEthnic.InsertColumn(1, _T("Name"), CFMT_TEXT, 150);


	m_wndOccupation.InsertColumn(0, _T("ID"), CFMT_NUMBER, 50);
	m_wndOccupation.InsertColumn(1, _T("Name"), CFMT_TEXT, 200);

	
	m_wndAddress.InsertColumn(0, _T("ID"), CFMT_TEXT, 70);
	m_wndAddress.InsertColumn(1, _T("Name"), CFMT_TEXT, 500);
	m_wndAddress.InsertColumn(2, _T("Code"), CFMT_TEXT, 100);
	
	m_wndIntroduction.InsertColumn(0, _T("ID"), CFMT_NUMBER, 50);
	m_wndIntroduction.InsertColumn(1, _T("Name"), CFMT_TEXT, 150);
	m_wndIntroduction.InsertColumn(3, _T("Desc"), CFMT_TEXT, 150);

	m_wndObject.InsertColumn(0, _T("ID"), CFMT_TEXT, 50);
	m_wndObject.InsertColumn(1, _T("Name"), CFMT_TEXT, 180);
	m_wndObject.InsertColumn(2, _T("Has Card"), CFMT_TEXT, 0);
	m_wndObject.InsertColumn(3, _T("type"), CFMT_TEXT, 0);
	m_wndObject.InsertColumn(4, _T("discount"), CFMT_NUMBER, 0);
	

	m_wndPatientState.InsertColumn(0, _T("ID"), CFMT_TEXT, 50);
	m_wndPatientState.InsertColumn(1, _T("Name"), CFMT_TEXT, 180);


	m_wndExamType.InsertColumn(0, _T("ID"), CFMT_NUMBER, 50);
	m_wndExamType.InsertColumn(1, _T("Name"), CFMT_TEXT, 350);
	m_wndExamType.InsertColumn(2, _T("Service Price"), CFMT_NUMBER, 100);
	m_wndExamType.InsertColumn(3, _T("Insurance Price"), CFMT_NUMBER, 100);
	m_wndExamType.InsertColumn(4, _T("RefItemid"), CFMT_NUMBER, 0);
	m_wndExamType.InsertColumn(5, _T("Multi"), CFMT_TEXT, 0);
	m_wndExamType.InsertColumn(6, _T("RoomID"), CFMT_TEXT, 0);


	m_wndRoom.InsertColumn(0, _T("ID"), CFMT_NUMBER, 30);
	m_wndRoom.InsertColumn(1, _T("Name"), CFMT_TEXT, 250);
	//m_wndRoom.InsertColumn(2, _T("Department"), CFMT_TEXT, 0);

	
	m_wndPatientNameFind.InsertColumn(0, _T("PatientNo"), CFMT_NUMBER, 0);
	m_wndPatientNameFind.InsertColumn(1, _T("Patien Name"), CFMT_TEXT, 200);
	m_wndPatientNameFind.InsertColumn(2, _T("Age"), CFMT_TEXT, 60);
	m_wndPatientNameFind.InsertColumn(3, _T("Exam Date"), CFMT_DATE, 100);
	m_wndPatientNameFind.InsertColumn(4, _T("Address"), CFMT_TEXT, 250);
	m_wndPatientNameFind.InsertColumn(5, _T("Phone"), CFMT_TEXT, 90);
	
	

	//hms_patient: thong tin chinh cua benh nhan
	m_hms_patientTbl.SetTableName(_T("hms_patient"));
	m_hms_patientTbl.AddField(_T("hp_createdby"), dfText, 15); 
	m_hms_patientTbl.AddField(_T("hp_createddate"), dfDateTime); 
	m_hms_patientTbl.AddField(_T("hp_updatedby"), dfText, 15); 
	m_hms_patientTbl.AddField(_T("hp_patientno"), dfLong); 
	m_hms_patientTbl.AddField(_T("hp_patientid"), dfText, 15); 
	m_hms_patientTbl.AddField(_T("hp_surname"), dfText, 45); 
	m_hms_patientTbl.AddField(_T("hp_midname"), dfText, 45); 
	m_hms_patientTbl.AddField(_T("hp_firstname"), dfText, 45); 
	m_hms_patientTbl.AddField(_T("hp_birthdate"), dfDate); 
	m_hms_patientTbl.AddField(_T("hp_sex"), dfText, 1); 
	m_hms_patientTbl.AddField(_T("hp_ethnic"), dfInteger); 
	m_hms_patientTbl.AddField(_T("hp_sin"), dfText, 13); 
	m_hms_patientTbl.AddField(_T("hp_provid"), dfInteger); 
	m_hms_patientTbl.AddField(_T("hp_distid"), dfLong); 
	m_hms_patientTbl.AddField(_T("hp_villid"), dfLong); 
	m_hms_patientTbl.AddField(_T("hp_dtladdr"), dfText, 128); 
	m_hms_patientTbl.AddField(_T("hp_occupation"), dfInteger);
	m_hms_patientTbl.AddField(_T("hp_workplace"), dfText, 128); 
	m_hms_patientTbl.AddField(_T("hp_workplaceid"), dfText, 13); 
	m_hms_patientTbl.AddField(_T("hp_status"), dfText, 1); 
	m_hms_patientTbl.AddField(_T("hp_rank"), dfInteger); 
	m_hms_patientTbl.AddField(_T("hp_position"), dfInteger); 
	m_hms_patientTbl.AddField(_T("hp_cmnd"), dfText, 13); 
	m_hms_patientTbl.AddField(_T("hp_yearofbirth"), dfText, 1); 
	m_hms_patientTbl.AddField(_T("hp_nationality"), dfText, 3); 
	m_hms_patientTbl.AddField(_T("hp_cmnddate"), dfDate);
	

	//hms_doc: Thong tin tung dot kham cua benh nhan
	m_hms_docTbl.SetTableName(_T("hms_doc"));
	m_hms_docTbl.AddField(_T("hd_createdby"), dfText, 15); 
	m_hms_docTbl.AddField(_T("hd_createddate"), dfDateTime); 
	m_hms_docTbl.AddField(_T("hd_updatedby"), dfText, 15); 
	m_hms_docTbl.AddField(_T("hd_updateddate"), dfDateTime); 
	m_hms_docTbl.AddField(_T("hd_docno"), dfLong); 
	m_hms_docTbl.AddField(_T("hd_patientno"), dfLong); 
	m_hms_docTbl.AddField(_T("hd_status"), dfText, 1); 
	m_hms_docTbl.AddField(_T("hd_telephone"), dfText, 13); 
	m_hms_docTbl.AddField(_T("hd_relative"), dfText, 65); 
	m_hms_docTbl.AddField(_T("hd_relation"), dfInteger); 
	m_hms_docTbl.AddField(_T("hd_contactaddr"), dfText, 254); 
	m_hms_docTbl.AddField(_T("hd_contacttel"), dfText, 13); 
	m_hms_docTbl.AddField(_T("hd_object"), dfText, 3); 
	m_hms_docTbl.AddField(_T("hd_cardno"), dfText, 25); 
	m_hms_docTbl.AddField(_T("hd_cardidx"), dfLong); 
	m_hms_docTbl.AddField(_T("hd_insregdate"), dfDate); 
	m_hms_docTbl.AddField(_T("hd_disrate"), dfInteger); 
	m_hms_docTbl.AddField(_T("hd_insline"), dfText, 1); 
	m_hms_docTbl.AddField(_T("hd_admitstate"), dfText, 1); 
	m_hms_docTbl.AddField(_T("hd_admitdate"), dfDateTime); 
	m_hms_docTbl.AddField(_T("hd_admitdept"), dfText, 7); 
	m_hms_docTbl.AddField(_T("hd_transplace"), dfText, 254); 
	m_hms_docTbl.AddField(_T("hd_transdiagn"), dfText, 245); 
	m_hms_docTbl.AddField(_T("hd_transplaceid"), dfText, 7); 
	m_hms_docTbl.AddField(_T("hd_xobject"), dfText, 1); 
	m_hms_docTbl.AddField(_T("hd_xcardno"), dfText, 25); 
	m_hms_docTbl.AddField(_T("hd_xissueplace"), dfText, 128); 	
	m_hms_docTbl.AddField(_T("hd_xissuedate"), dfDate); 
	m_hms_docTbl.AddField(_T("hd_reexam"),dfText,1);
	m_hms_docTbl.AddField(_T("hd_emergency"),dfText,1);
	//m_hms_docTbl.AddField(_T("hd_over5year"),dfText,1);
	//m_hms_docTbl.AddField(_T("hd_over5yeardate"),dfDate);	
	//m_hms_docTbl.AddField(_T("hd_datediscountall"),dfDate);	
	m_hms_docTbl.AddField(_T("hd_ma_doituong_kcb"), dfText, 4);

	//m_hms_docTbl.AddField(_T("hd_transicd"), dfText, 11); 
	

	//hms_card: Thong tin the cua benh nhan
	m_hms_cardTbl.SetTableName(_T("hms_card"));
	m_hms_cardTbl.AddField(_T("hc_createdby"), dfText, 15); 
	m_hms_cardTbl.AddField(_T("hc_createddate"), dfDateTime); 
	m_hms_cardTbl.AddField(_T("hc_updatedby"), dfText, 15); 
	m_hms_cardTbl.AddField(_T("hc_patientno"), dfLong); 
	m_hms_cardTbl.AddField(_T("hc_cardno"), dfText, 25); 
	m_hms_cardTbl.AddField(_T("hc_idx"), dfLong); 
	m_hms_cardTbl.AddField(_T("hc_regdate"), dfDate); 
	m_hms_cardTbl.AddField(_T("hc_expdate"), dfDate); 
	m_hms_cardTbl.AddField(_T("hc_regcode"), dfText, 11); 
	m_hms_cardTbl.AddField(_T("hc_company"), dfText, 254); 
	m_hms_cardTbl.AddField(_T("hc_code"), dfText, 3); 
	m_hms_cardTbl.AddField(_T("hc_discount"), dfInteger); 	
	m_hms_cardTbl.AddField(_T("hc_active"), dfText, 1);
	m_hms_cardTbl.AddField(_T("hc_groupid"), dfInteger);	
	m_hms_cardTbl.AddField(_T("hc_area"), dfText, 3);

	//Thong tin cac lan kham cua benh nhan
	m_hms_examTbl.SetTableName(_T("hms_exam"));
	m_hms_examTbl.AddField(_T("he_createdby"), dfText, 15); 
	m_hms_examTbl.AddField(_T("he_createddate"), dfDateTime); 
	m_hms_examTbl.AddField(_T("he_updatedby"), dfText, 15); 
	m_hms_examTbl.AddField(_T("he_patientno"), dfLong); 
	m_hms_examTbl.AddField(_T("he_docno"), dfLong); 
	m_hms_examTbl.AddField(_T("he_deptid"), dfText, 7); 
	m_hms_examTbl.AddField(_T("he_roomid"), dfInteger); 
	m_hms_examTbl.AddField(_T("he_receptno"), dfInteger); 
	m_hms_examTbl.AddField(_T("he_receptidx"), dfInteger); 
	m_hms_examTbl.AddField(_T("he_examtype"), dfText, 13); 
	m_hms_examTbl.AddField(_T("he_status"), dfText, 1); 
	m_hms_examTbl.AddField(_T("he_examdate"), dfDateTime); 
	m_hms_examTbl.AddField(_T("he_doctor"), dfText, 15); 
	m_hms_examTbl.AddField(_T("he_examine"), dfText, 512); 
    m_hms_examTbl.AddField(_T("he_prediagnostic"), dfText, 128); 
	m_hms_examTbl.AddField(_T("he_diagnostic"), dfText, 254); 
	m_hms_examTbl.AddField(_T("he_hasfee"), dfText, 1); 
	m_hms_examTbl.AddField(_T("he_payment"), dfText, 1); 
	// 14/01/2017 bỏ he_typeid vì khi sửa ngoài tiếp đón nó lại update trường này về 0 nên mất kiểu khám bác sỹ đã chọn trong khám bệnh
	//m_hms_examTbl.AddField(_T("he_typeid"), dfInteger); 

	CString szSQL;
	CRecord rs(&pMF->m_db);
	szSQL.Format(_T("SELECT hf_hospitalidinsline FROM hms_config"));
	rs.ExecSQL(szSQL);
	rs.GetValue(_T("hf_hospitalidinsline"), m_szInsLine);

}
#include "Resource.h"
void CHMSRegistration::OnSetWindowEvents(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	m_wndRoomList.SetEvent(WE_SELCHANGE, _OnRoomListSelectChangeFnc);
	m_wndRoomList.SetEvent(WE_LOADDATA, _OnRoomListLoadDataFnc);
	m_wndRoomList.SetEvent(WE_DBLCLICK, _OnRoomListDblClickFnc);
	//m_wndRoomList.SetWindowText(_T("Rooms Information"));
	m_wndRoomList.AddEvent(1, _T("Refresh"), _OnRoomListLoadDataFnc);
	m_wndExamList.SetEvent(WE_SELCHANGE, _OnExamListSelectChangeFnc);
	m_wndExamList.SetEvent(WE_LOADDATA, _OnExamListLoadDataFnc);
	m_wndExamList.SetEvent(WE_DBLCLICK, _OnExamListDblClickFnc);
	m_wndExamList.SetWindowText(_T("Examination Receipts"));

	m_wndExamList.AddEvent(1, _T("Set Priority"), _OnExamListSetPriorityFnc);
	m_wndExamList.AddEvent(2, _T("Delete Examination Receipt"), _OnExamListDeleteItemFnc, 0, VK_DELETE, 0);
	//m_wndPatientNo.SetEvent(WE_CHANGE, _OnPatientNoChangeFnc);
	//m_wndPatientNo.SetEvent(WE_SETFOCUS, _OnPatientNoSetfocusFnc);
	//m_wndPatientNo.SetEvent(WE_KILLFOCUS, _OnPatientNoKillfocusFnc);
	m_wndPatientNo.SetEvent(WE_CHECKVALUE, _OnPatientNoCheckValueFnc);
	//m_wndDocumentNo.SetEvent(WE_CHANGE, _OnDocumentNoChangeFnc);
	m_wndDocumentNo.SetEvent(WE_SETFOCUS, _OnDocumentNoSetfocusFnc);
	//m_wndDocumentNo.SetEvent(WE_KILLFOCUS, _OnDocumentNoKillfocusFnc);
	m_wndDocumentNo.SetEvent(WE_CHECKVALUE, _OnDocumentNoCheckValueFnc);
	//m_wndCardNoFind.SetEvent(WE_CHANGE, _OnCardNoFindChangeFnc);
	//m_wndCardNoFind.SetEvent(WE_SETFOCUS, _OnCardNoFindSetfocusFnc);
	//m_wndCardNoFind.SetEvent(WE_KILLFOCUS, _OnCardNoFindKillfocusFnc);
	m_wndCardNoFind.SetEvent(WE_CHECKVALUE, _OnCardNoFindCheckValueFnc);
	//m_wndPatientName.SetEvent(WE_CHANGE, _OnPatientNameChangeFnc);
	//m_wndPatientName.SetEvent(WE_SETFOCUS, _OnPatientNameSetfocusFnc);
	//m_wndPatientName.SetEvent(WE_KILLFOCUS, _OnPatientNameKillfocusFnc);
	m_wndPatientName.SetEvent(WE_CHECKVALUE, _OnPatientNameCheckValueFnc);
	//m_wndAge.SetEvent(WE_CHANGE, _OnAgeChangeFnc);
	//m_wndAge.SetEvent(WE_SETFOCUS, _OnAgeSetfocusFnc);
	//m_wndAge.SetEvent(WE_KILLFOCUS, _OnAgeKillfocusFnc);
	m_wndAge.SetEvent(WE_CHECKVALUE, _OnAgeCheckValueFnc);
	//m_wndBirthDate.SetEvent(WE_CHANGE, _OnBirthDateChangeFnc);
	//m_wndBirthDate.SetEvent(WE_SETFOCUS, _OnBirthDateSetfocusFnc);
	//m_wndBirthDate.SetEvent(WE_KILLFOCUS, _OnBirthDateKillfocusFnc);
	//m_wndBirthDate.SetEvent(WE_CHECKVALUE, _OnBirthDateCheckValueFnc);
	m_wndSex.SetEvent(WE_SELENDOK, _OnSexSelendokFnc);
	//m_wndSex.SetEvent(WE_SETFOCUS, _OnSexSetfocusFnc);
	//m_wndSex.SetEvent(WE_KILLFOCUS, _OnSexKillfocusFnc);
	m_wndSex.SetEvent(WE_SELCHANGE, _OnSexSelectChangeFnc);
	m_wndSex.SetEvent(WE_LOADDATA, _OnSexLoadDataFnc);
	//m_wndSex.SetEvent(WE_ADDNEW, _OnSexAddNewFnc);
	m_wndEthnic.SetEvent(WE_SELENDOK, _OnEthnicSelendokFnc);
	//m_wndEthnic.SetEvent(WE_SETFOCUS, _OnEthnicSetfocusFnc);
	//m_wndEthnic.SetEvent(WE_KILLFOCUS, _OnEthnicKillfocusFnc);
	m_wndEthnic.SetEvent(WE_SELCHANGE, _OnEthnicSelectChangeFnc);
	m_wndEthnic.SetEvent(WE_LOADDATA, _OnEthnicLoadDataFnc);
	//m_wndEthnic.SetEvent(WE_ADDNEW, _OnEthnicAddNewFnc);
	m_wndOccupation.SetEvent(WE_SELENDOK, _OnOccupationSelendokFnc);
	//m_wndOccupation.SetEvent(WE_SETFOCUS, _OnOccupationSetfocusFnc);
	//m_wndOccupation.SetEvent(WE_KILLFOCUS, _OnOccupationKillfocusFnc);
	m_wndOccupation.SetEvent(WE_SELCHANGE, _OnOccupationSelectChangeFnc);
	m_wndOccupation.SetEvent(WE_LOADDATA, _OnOccupationLoadDataFnc);
	//m_wndOccupation.SetEvent(WE_ADDNEW, _OnOccupationAddNewFnc);
	m_wndAddress.SetEvent(WE_SELENDOK, _OnAddressSelendokFnc);
	//m_wndAddress.SetEvent(WE_SETFOCUS, _OnAddressSetfocusFnc);
	//m_wndAddress.SetEvent(WE_KILLFOCUS, _OnAddressKillfocusFnc);
	m_wndAddress.SetEvent(WE_SELCHANGE, _OnAddressSelectChangeFnc);
	m_wndAddress.SetEvent(WE_LOADDATA, _OnAddressLoadDataFnc);
	//m_wndAddress.SetEvent(WE_ADDNEW, _OnAddressAddNewFnc);
	//m_wndDetailAddress.SetEvent(WE_CHANGE, _OnDetailAddressChangeFnc);
	//m_wndDetailAddress.SetEvent(WE_SETFOCUS, _OnDetailAddressSetfocusFnc);
	//m_wndDetailAddress.SetEvent(WE_KILLFOCUS, _OnDetailAddressKillfocusFnc);
	m_wndDetailAddress.SetEvent(WE_CHECKVALUE, _OnDetailAddressCheckValueFnc);
	//m_wndWorkingPlace.SetEvent(WE_CHANGE, _OnWorkingPlaceChangeFnc);
	//m_wndWorkingPlace.SetEvent(WE_SETFOCUS, _OnWorkingPlaceSetfocusFnc);
	//m_wndWorkingPlace.SetEvent(WE_KILLFOCUS, _OnWorkingPlaceKillfocusFnc);
	m_wndWorkingPlace.SetEvent(WE_CHECKVALUE, _OnWorkingPlaceCheckValueFnc);
	m_wndIntroduction.SetEvent(WE_SELENDOK, _OnIntroductionSelendokFnc);
	//m_wndIntroduction.SetEvent(WE_SETFOCUS, _OnIntroductionSetfocusFnc);
	//m_wndIntroduction.SetEvent(WE_KILLFOCUS, _OnIntroductionKillfocusFnc);
	m_wndIntroduction.SetEvent(WE_SELCHANGE, _OnIntroductionSelectChangeFnc);
	m_wndIntroduction.SetEvent(WE_LOADDATA, _OnIntroductionLoadDataFnc);
	//m_wndIntroduction.SetEvent(WE_ADDNEW, _OnIntroductionAddNewFnc);
	

	m_wndProvill.SetEvent(WE_SELENDOK, _OnProvillSelendokFnc);
	//m_wndProvill.SetEvent(WE_SETFOCUS, _OnProvillSetfocusFnc);
	//m_wndProvill.SetEvent(WE_KILLFOCUS, _OnProvillKillfocusFnc);
	m_wndProvill.SetEvent(WE_SELCHANGE, _OnProvillSelectChangeFnc);
	m_wndProvill.SetEvent(WE_LOADDATA, _OnProvillLoadDataFnc);
	//m_wndProvill.SetEvent(WE_ADDNEW, _OnProvillAddNewFnc);
	m_wndDistrict.SetEvent(WE_SELENDOK, _OnDistrictSelendokFnc);
	//m_wndDistrict.SetEvent(WE_SETFOCUS, _OnDistrictSetfocusFnc);
	//m_wndDistrict.SetEvent(WE_KILLFOCUS, _OnDistrictKillfocusFnc);
	m_wndDistrict.SetEvent(WE_SELCHANGE, _OnDistrictSelectChangeFnc);
	m_wndDistrict.SetEvent(WE_LOADDATA, _OnDistrictLoadDataFnc);
	//m_wndDistrict.SetEvent(WE_ADDNEW, _OnDistrictAddNewFnc);
	m_wndVillage.SetEvent(WE_SELENDOK, _OnVillageSelendokFnc);
	//m_wndVillage.SetEvent(WE_SETFOCUS, _OnVillageSetfocusFnc);
	//m_wndVillage.SetEvent(WE_KILLFOCUS, _OnVillageKillfocusFnc);
	m_wndVillage.SetEvent(WE_SELCHANGE, _OnVillageSelectChangeFnc);
	m_wndVillage.SetEvent(WE_LOADDATA, _OnVillageLoadDataFnc);
	//m_wndVillage.SetEvent(WE_ADDNEW, _OnVillageAddNewFnc);

	//m_wndPhone.SetEvent(WE_CHANGE, _OnPhoneChangeFnc);
	//m_wndPhone.SetEvent(WE_SETFOCUS, _OnPhoneSetfocusFnc);
	//m_wndPhone.SetEvent(WE_KILLFOCUS, _OnPhoneKillfocusFnc);
	m_wndPhone.SetEvent(WE_CHECKVALUE, _OnPhoneCheckValueFnc);
	m_wndObject.SetEvent(WE_SELENDOK, _OnObjectSelendokFnc);
	//m_wndObject.SetEvent(WE_SETFOCUS, _OnObjectSetfocusFnc);
	//m_wndObject.SetEvent(WE_KILLFOCUS, _OnObjectKillfocusFnc);
	m_wndObject.SetEvent(WE_SELCHANGE, _OnObjectSelectChangeFnc);
	m_wndObject.SetEvent(WE_LOADDATA, _OnObjectLoadDataFnc);
	//m_wndObject.SetEvent(WE_ADDNEW, _OnObjectAddNewFnc);
	//m_wndCardNo.SetEvent(WE_CHANGE, _OnCardNoChangeFnc);
	//m_wndCardNo.SetEvent(WE_SETFOCUS, _OnCardNoSetfocusFnc);
	//m_wndCardNo.SetEvent(WE_KILLFOCUS, _OnCardNoKillfocusFnc);
	m_wndCardNo.SetEvent(WE_CHECKVALUE, _OnCardNoCheckValueFnc);
	m_wndCardNoButton.SetEvent(WE_CLICK, _OnCardNoButtonSelectFnc);
	m_wndPatientState.SetEvent(WE_SELENDOK, _OnPatientStateSelendokFnc);
	//m_wndPatientState.SetEvent(WE_SETFOCUS, _OnPatientStateSetfocusFnc);
	//m_wndPatientState.SetEvent(WE_KILLFOCUS, _OnPatientStateKillfocusFnc);
	m_wndPatientState.SetEvent(WE_SELCHANGE, _OnPatientStateSelectChangeFnc);
	m_wndPatientState.SetEvent(WE_LOADDATA, _OnPatientStateLoadDataFnc);
	//m_wndPatientState.SetEvent(WE_ADDNEW, _OnPatientStateAddNewFnc);
	//m_wndExamDate.SetEvent(WE_CHANGE, _OnExamDateChangeFnc);
	//m_wndExamDate.SetEvent(WE_SETFOCUS, _OnExamDateSetfocusFnc);
	//m_wndExamDate.SetEvent(WE_KILLFOCUS, _OnExamDateKillfocusFnc);
	m_wndExamDate.SetEvent(WE_CHECKVALUE, _OnExamDateCheckValueFnc);
	m_wndExamType.SetEvent(WE_SELENDOK, _OnExamTypeSelendokFnc);
	//m_wndExamType.SetEvent(WE_SETFOCUS, _OnExamTypeSetfocusFnc);
	//m_wndExamType.SetEvent(WE_KILLFOCUS, _OnExamTypeKillfocusFnc);
	m_wndExamType.SetEvent(WE_SELCHANGE, _OnExamTypeSelectChangeFnc);
	m_wndExamType.SetEvent(WE_LOADDATA, _OnExamTypeLoadDataFnc);
	//m_wndExamType.SetEvent(WE_ADDNEW, _OnExamTypeAddNewFnc);
	m_wndRoom.SetEvent(WE_SELENDOK, _OnRoomSelendokFnc);
	//m_wndRoom.SetEvent(WE_SETFOCUS, _OnRoomSetfocusFnc);
	//m_wndRoom.SetEvent(WE_KILLFOCUS, _OnRoomKillfocusFnc);
	m_wndRoom.SetEvent(WE_SELCHANGE, _OnRoomSelectChangeFnc);
	m_wndRoom.SetEvent(WE_LOADDATA, _OnRoomLoadDataFnc);
	//m_wndRoom.SetEvent(WE_ADDNEW, _OnRoomAddNewFnc);
	//m_wndDisease.SetEvent(WE_CHANGE, _OnDiseaseChangeFnc);
	//m_wndDisease.SetEvent(WE_SETFOCUS, _OnDiseaseSetfocusFnc);
	//m_wndDisease.SetEvent(WE_KILLFOCUS, _OnDiseaseKillfocusFnc);
	m_wndDisease.SetEvent(WE_CHECKVALUE, _OnDiseaseCheckValueFnc);
	m_wndDiseaseBtn.SetEvent(WE_CLICK, _OnDiseaseBtnSelectFnc);
	//m_wndExaminePerWeek.SetEvent(WE_CHANGE, _OnExaminePerWeekChangeFnc);
	//m_wndExaminePerWeek.SetEvent(WE_SETFOCUS, _OnExaminePerWeekSetfocusFnc);
	//m_wndExaminePerWeek.SetEvent(WE_KILLFOCUS, _OnExaminePerWeekKillfocusFnc);
	//m_wndExaminePerWeek.SetEvent(WE_CHECKVALUE, _OnExaminePerWeekCheckValueFnc);
	//m_wndExaminePerMonth.SetEvent(WE_CHANGE, _OnExaminePerMonthChangeFnc);
	//m_wndExaminePerMonth.SetEvent(WE_SETFOCUS, _OnExaminePerMonthSetfocusFnc);
	//m_wndExaminePerMonth.SetEvent(WE_KILLFOCUS, _OnExaminePerMonthKillfocusFnc);
	//m_wndExaminePerMonth.SetEvent(WE_CHECKVALUE, _OnExaminePerMonthCheckValueFnc);
	//m_wndAppointReexamine.SetEvent(WE_CLICK, _OnAppointReexamineSelectFnc);

	m_wndNationality.SetEvent(WE_CLICK, _OnNationalitySelectFnc);


	m_wndPatientNameFind.SetEvent(WE_SELENDOK, _OnPatientNameFindSelendokFnc);
	//m_wndPatientNameFind.SetEvent(WE_SETFOCUS, _OnPatientNameFindSetfocusFnc);
	//m_wndPatientNameFind.SetEvent(WE_KILLFOCUS, _OnPatientNameFindKillfocusFnc);
	m_wndPatientNameFind.SetEvent(WE_SELCHANGE, _OnPatientNameFindSelectChangeFnc);
	m_wndPatientNameFind.SetEvent(WE_LOADDATA, _OnPatientNameFindLoadDataFnc);
	//m_wndPatientNameFind.SetEvent(WE_ADDNEW, _OnPatientNameFindAddNewFnc);

	m_wndAddNew.SetEvent(WE_CLICK, _OnAddNewSelectFnc);
	m_wndEdit.SetEvent(WE_CLICK, _OnEditSelectFnc);
	m_wndDelete.SetEvent(WE_CLICK, _OnDeleteSelectFnc);
	m_wndSave.SetEvent(WE_CLICK, _OnSaveSelectFnc);
	m_wndCancel.SetEvent(WE_CLICK, _OnCancelSelectFnc);
	m_wndPrint.SetEvent(WE_CLICK, _OnPrintSelectFnc);
	m_wndThemDV.SetEvent(WE_CLICK, _OnThemDVSelectFnc);

	AddEvent(1, _T("Add New Patient\tCtrl+A"), _OnAddHMSRegistrationFnc, 0, 'A', VK_CONTROL);
	AddEvent(2, _T("Create Document\tCtrl+N"), _OnAddNewDocumentFnc, 0, 'N', VK_CONTROL);
	AddEvent(3, _T("Create Reception"), _OnAddNewReceptionFnc);
	AddEvent(0, _T("-"));
	AddEvent(4, _T("Edit Patient Information\tCtrl+E"), _OnEditHMSRegistrationFnc, 0, 'E', VK_CONTROL);		
	AddEvent(0, _T("-"));
	AddEvent(5, _T("Print Reception\tCtrl+P"), _OnPrintReceptionFnc, 0,'P',VK_CONTROL);
	AddEvent(6, _T("In thẻ"), _OnKhamsuckhoeFnc);
	AddEvent(7, _T("In phiếu yc sử dụng dịch vụ"), _OnPrintYCSDDVFnc);		
	AddEvent(0, _T("-"));
	AddEvent(8, _T("Do Functional Test\tF5"), _OnFunctionalTestFnc, 0, VK_F5);
	
	if(pMF->m_szObjectInsurance == _T("Y")){
		AddEvent(9, _T("Cập nhật thông tin thẻ BH"), _OnEditCardInformationFnc);
	}	
	AddEvent(0, _T("-"));
	AddEvent(10, _T("Thông tin sản khoa"), _OnKhamsankhoaFnc);
	AddEvent(0, _T("-"));
	AddEvent(11, _T("Capture Patient\tF6"), _OnCapturePatientFnc, 0, VK_F6);

	
	OnRoomListLoadData();

	SetWindowFont(&m_wndPatientName, GetFaceName(), 15);
	m_wndPatientName.SetTextColor(RGB(0, 0, 255));
	SetWindowFont(&m_wndDocumentNo, GetFaceName(), GetFaceSize()+2, true);
	m_wndDocumentNo.SetTextColor(RGB(255, 0, 0));
	
	
	SetWindowFont(&m_wndCardNo, GetFaceName(), GetFaceSize(), true);
	SetWindowFont(&m_wndSheetNo, GetFaceName(), GetFaceSize()+2, true);
	m_wndSheetNo.SetTextColor(RGB(0, 0, 255));

}
void CHMSRegistration::OnDoDataExchange(CDataExchange* pDX){	
	DDX_Text(pDX, m_wndPatientNo.GetDlgCtrlID(), m_nPatientNo);
	DDX_Text(pDX, m_wndDocumentNo.GetDlgCtrlID(), m_nDocumentNo);	
	DDX_Text(pDX, m_wndPatientName.GetDlgCtrlID(), m_szPatientName);	
	DDX_Text(pDX, m_wndAge.GetDlgCtrlID(), m_szAge);
	DDX_TextEx(pDX, m_wndBirthDate.GetDlgCtrlID(), m_szBirthDate);
	DDX_TextEx(pDX, m_wndSex.GetDlgCtrlID(), m_szSexKey);
	DDX_TextEx(pDX, m_wndEthnic.GetDlgCtrlID(), m_szEthnicKey);
	DDX_TextEx(pDX, m_wndOccupation.GetDlgCtrlID(), m_szOccupationKey);
	DDX_TextEx(pDX, m_wndProvill.GetDlgCtrlID(), m_szProvillKey);	
	DDX_TextEx(pDX, m_wndVillage.GetDlgCtrlID(), m_szVillageKey);
	DDX_Text(pDX, m_wndDetailAddress.GetDlgCtrlID(), m_szDetailAddress);	
	DDX_Text(pDX, m_wndRelative.GetDlgCtrlID(), m_szRelative);
	DDX_TextEx(pDX, m_wndIntroduction.GetDlgCtrlID(), m_szIntroductionKey);	
	DDX_Text(pDX, m_wndContactAddress.GetDlgCtrlID(), m_szContactAddress);
	DDX_Text(pDX, m_wndPhone.GetDlgCtrlID(), m_szPhone);
	DDX_TextEx(pDX, m_wndObject.GetDlgCtrlID(), m_szObjectKey);
	DDX_Text(pDX, m_wndCardNo.GetDlgCtrlID(), m_szCardNo);
	DDX_TextEx(pDX, m_wndPatientState.GetDlgCtrlID(), m_szPatientStateKey);
	DDX_TextEx(pDX, m_wndExamDate.GetDlgCtrlID(), m_szExamDate);
	DDX_TextEx(pDX, m_wndExamType.GetDlgCtrlID(), m_szExamTypeKey);
	DDX_TextEx(pDX, m_wndRoom.GetDlgCtrlID(), m_szRoomKey);
	DDX_Text(pDX, m_wndSheetNo.GetDlgCtrlID(), m_szSheetNo);	
	DDX_Text(pDX, m_wndExaminePerWeek.GetDlgCtrlID(), m_nExaminePerWeek);
	DDX_Text(pDX, m_wndExaminePerMonth.GetDlgCtrlID(), m_nExaminePerMonth);
	DDX_Check(pDX, m_wndAppointReexamine.GetDlgCtrlID(), m_bAppointReexamine);
	DDX_TextEx(pDX, m_wndAppointReexamineDate.GetDlgCtrlID(), m_szAppointReexamineDate);
	DDX_Text(pDX, m_wndLabelTitle.GetDlgCtrlID(), m_szTitle);
	DDX_Text(pDX, m_wndDisease.GetDlgCtrlID(), m_szDisease);	
	DDX_Text(pDX, m_wndCardNoFind.GetDlgCtrlID(), m_szCardNoFind);	
	DDX_TextEx(pDX, m_wndPatientNameFind.GetDlgCtrlID(), m_szPatientNameFindKey);	
	DDX_Check(pDX, m_wndYearofBirth.GetDlgCtrlID(), m_bYearofBirth);
	DDX_Text(pDX, m_wndCMND.GetDlgCtrlID(), m_szCMND);
	DDX_TextEx(pDX, m_wndNgaycapCMND.GetDlgCtrlID(), m_szNgaycapCMND);
}
void CHMSRegistration::GetDataToScreen(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CString szSQL, tmpStr, szTelephone, szContacttel;
	CString szWhere;

	CRecord rs(&pMF->m_db);
	SetDefaultValues();

	if(m_nDocumentNo <=0 )
		szSQL.Format(_T("SELECT * FROM hms_doc WHERE hd_patientno=%ld and hd_status <> 'C' ORDER BY hd_docno DESC Limit 1"), m_nPatientNo);
	else
		szSQL.Format(_T("SELECT * FROM hms_doc WHERE hd_docno=%ld and hd_status <> 'C'"), m_nDocumentNo);
	rs.ExecSQL(szSQL);
	if(!rs.IsEOF()){
		rs.GetValue(_T("hd_docno"), m_nDocumentNo); 
	//	rs.GetValue(_T("hd_status"), m_szStatus); 		
		rs.GetValue(_T("hd_relative"), m_szRelative); 
		rs.GetValue(_T("hd_relation"), m_szIntroductionKey); 
		rs.GetValue(_T("hd_contactaddr"), m_szContactAddress); 
		rs.GetValue(_T("hd_telephone"), m_szPhone);				

		rs.GetValue(_T("hd_transplaceid"), m_szHospital);
		
		if(m_szHospital.IsEmpty())
		{
			rs.GetValue(_T("hd_transplace"), tmpStr);
			m_wndHospital.SetCurrent(1, tmpStr);
		}
		rs.GetValue(_T("hd_transdiagn"), m_szDisease); 
		rs.GetValue(_T("hd_admitstate"), m_szPatientStateKey); 
		rs.GetValue(_T("hd_object"), m_szObjectKey); 

		rs.GetValue(_T("hd_cardno"), m_szCardNo); 
		rs.GetValue(_T("hd_cardidx"), m_nCardIdx); 
		rs.GetValue(_T("hd_disrate"), m_nDisrate); 
		rs.GetValue(_T("hd_insline"), m_szOffLine);
		m_szCurCardNo = m_szCardNo;		
	
		rs.GetValue(_T("hd_admitdate"), m_szExamDate); 
		rs.GetValue(_T("hd_admitdept"), m_szDept);
		rs.GetValue(_T("hd_status"), m_szDocStatus);
		rs.GetValue(_T("hd_suggestion"), m_szSuggesstion);
		rs.GetValue(_T("hd_ma_doituong_kcb"), m_szDoituongkcb);

		rs.GetValue(_T("hd_xobject"), m_sCardInfo.xobject);
		rs.GetValue(_T("hd_xcardno"), m_sCardInfo.xCardno);
		rs.GetValue(_T("hd_xissuedate"), m_sCardInfo.xIssueDate);
		rs.GetValue(_T("hd_xissueplace"), m_sCardInfo.xIssuePlace);


		rs.GetValue(_T("hd_patientno"), m_nPatientNo);
		
		szSQL.Format(_T("SELECT * FROM hms_patient WHERE hp_patientno=%ld"), m_nPatientNo);
		rs.ExecSQL(szSQL);
		if(rs.IsEOF())
		{			
			SetMode(VM_NONE);
			return;
		}		

		rs.GetValue(_T("hp_surname"), tmpStr);
		m_szPatientName = tmpStr;
		rs.GetValue(_T("hp_midname"), tmpStr); 
		if(!tmpStr.IsEmpty())
		m_szPatientName += _T(" ")+tmpStr;
		rs.GetValue(_T("hp_firstname"), tmpStr); 
		if(!tmpStr.IsEmpty())
		m_szPatientName += _T(" ")+tmpStr;
		m_szPatientName.Trim();
		m_szPatientNameOld = m_szPatientName;
		rs.GetValue(_T("hp_birthdate"), m_szBirthDate);
		rs.GetValue(_T("hp_sex"), m_szSexKey); 
		rs.GetValue(_T("hp_ethnic"), m_szEthnicKey); 

		rs.GetValue(_T("hp_provid"), m_szProvillKey); 
		rs.GetValue(_T("hp_distid"), m_szDistrictKey); 
		rs.GetValue(_T("hp_villid"), m_szVillageKey); 
		rs.GetValue(_T("hp_dtladdr"), m_szDetailAddress);

		rs.GetValue(_T("hp_occupation"), m_szOccupationKey);
		/*if(m_szOccupationKey == _T("0"))
			m_szOccupationKey.Empty();*/

		
		rs.GetValue(_T("hp_workplace"), m_szWorkingPlace); 

		rs.GetValue(_T("hp_rank"), m_szRankKey); 
		rs.GetValue(_T("hp_position"), m_szPositionKey); 

		rs.GetValue(_T("hp_cmnd"), m_szCMND); 
		rs.GetValue(_T("hp_cmnddate"), m_szNgaycapCMND); 

		m_bYearofBirth = false;
		rs.GetValue(_T("hp_yearofbirth"), tmpStr);		
		if(tmpStr == _T("Y")) m_bYearofBirth = true;

		rs.GetValue(_T("hd_reexam"), tmpStr);
		if(tmpStr == _T("Y")) m_bAppointReexamine = true;
		

		rs.GetValue(_T("hp_nationality"), m_szNationality);		
		CRecord rsn(&pMF->m_db);
		CString szSQL2;
		szSQL2.Format(_T("SELECT hq_name FROM hms_quoctich WHERE hq_id='%s' "), m_szNationality);
		rsn.ExecSQL(szSQL2);
		rsn.GetValue(_T("hq_name"), tmpStr);
		m_szNationalityDesc.Format(_T("Quốc tịch [%s]"), tmpStr);
		m_wndNationality.SetWindowText(m_szNationalityDesc);


		CString szDay, szMonth, szYear, short_day, short_month;
		if(GetLocalLang() == 0)
		{
			szDay = _T("Day");
			szMonth = _T("Month");
			szYear = _T("Age");
			short_day = _T("d");
			short_month = _T("m");
		}
		else
		{
			TranslateString(_T("Day"), szDay);
			TranslateString(_T("Month"), szMonth);
			TranslateString(_T("Age"), szYear);
			short_day = _T("n");
			short_month = _T("t");
		}

		szSQL.Format(_T("SELECT hms_getage(date('%s'), '%s') "), m_szExamDate,  m_szBirthDate);
		rs.ExecSQL(szSQL);	
		m_szAge.Format(_T("%s"), rs.GetStringValue());
		if(m_szAge.Right(1) == _T("T"))
			m_szAge.Replace(_T("T"), szMonth);
		if(m_szAge.Right(1) == _T("N"))
			m_szAge.Replace(_T("N"), szDay);
		if(IsDigit(m_szAge)){
			m_szAge.AppendFormat(_T(" %s"), szYear);
		}


	bool bInsExpiryFlag = false;

//if has card the load informations of card
//Neu co the thi load cac thong tin the ra
	//_tprintf(_T("\r\nbCheckBarcode:%d"), m_bCheckBarcode);
		if(m_nCardIdx > 0)
		{
			szSQL.Format(_T("SELECT * FROM hms_card WHERE hc_patientno=%ld AND hc_idx=%ld"), m_nPatientNo,  m_nCardIdx);
			rs.ExecSQL(szSQL);
			if(!rs.IsEOF()){
				rs.GetValue(_T("hc_cardno"), m_szCardNo);
				m_szCurCardNo = m_szCardNo;
				m_szOldCardNo = m_szCardNo;
				rs.GetValue(_T("hc_regdate"), m_sCardInfo.regdate); 
				rs.GetValue(_T("hc_expdate"), m_sCardInfo.expdate); 
				
				rs.GetValue(_T("hc_regcode"), m_sCardInfo.regplacecde); 
				rs.GetValue(_T("hc_company"), m_sCardInfo.company); 
				
				if(!m_sCardInfo.company.IsEmpty())
					m_szWorkingPlace = m_sCardInfo.company;	

				rs.GetValue(_T("hc_code"), m_sCardInfo.code); 
				rs.GetValue(_T("hc_discount"), m_sCardInfo.discount);
				rs.GetValue(_T("hc_groupid"), m_sCardInfo.groupid);
				rs.GetValue(_T("hc_area"), m_sCardInfo.szArea);
//_msg(_T("%s"), m_sCardInfo.szArea);
				if(m_szOffLine != _T("Y"))
					m_nDisrate = m_sCardInfo.discount;

			/*	if(m_szOffLine == _T("Y"))
					m_wndCardNo.SetTextColor(RGB(255, 0, 0));
				else
					m_wndCardNo.SetTextColor(RGB(0, 0, 255));*/
				
				if(CompareDate(pMF->GetSysDate(), m_sCardInfo.expdate) > 0)
					bInsExpiryFlag = true;
				if(m_bHaveAdditionalCard)
				{
					if(m_szCardNo.Find(_T("HN")) != -1 )
						SetMenuState(11, true);					
					else
						SetMenuState(11, false);					

				}	

				CString szMess = pMF->CheckCardObjectLine(m_sCardInfo.code);
				if(!szMess.IsEmpty())
				{
					MessageBox(szMess);
					
				}
			}
		}
		//Lay du lieu cac phieu kham benh
		if(m_nReceptIdx > 0)
			szWhere.Format(_T(" AND he_receptidx=%ld "), m_nReceptIdx);
		szSQL.Format(_T("SELECT * FROM hms_exam WHERE he_docno=%ld %s ORDER BY he_receptidx DESC "), m_nDocumentNo, szWhere);
		rs.ExecSQL(szSQL);
		if(!rs.IsEOF()){
			rs.GetValue(_T("he_roomid"), m_szRoomKey); 
			m_szCurRoom = m_szRoomKey;
			rs.GetValue(_T("he_receptno"), m_nReceptNo); 
			rs.GetValue(_T("he_receptidx"), m_nReceptIdx); 
			rs.GetValue(_T("he_examdate"), m_szExamDate); 
			rs.GetValue(_T("he_status"), m_szExamStatus); 
			CString tmpStr;
			rs.GetValue(_T("he_examtype"), tmpStr);
			m_szExamTypeKey.Format(_T("%d"), ToInt(tmpStr.Right(3)));
			m_szExamTypeOld = m_szExamTypeKey;
			m_szRoomNameOld = m_szRoomKey;

			rs.GetValue(_T("he_hasfee"), m_szHasFee); 
			rs.GetValue(_T("he_payment"), m_szPayment); 
			m_szSheetNo.Format(_T("%s.%d"), m_szRoomKey, m_nReceptNo);
		}

		pMF->m_nDocumentNo = m_nDocumentNo;
		pMF->m_nRefIndex = m_nReceptIdx;
		pMF->m_nPatientNo = m_nPatientNo;
		pMF->m_nRoomID = ToInt(m_szRoomKey);
		
		m_nExaminePerMonth = m_nExaminePerWeek = 0;
		m_bAppointReexamine = FALSE;

		szSQL.Format(_T("SELECT sum(perweek) as perweek, sum(permonth) as permonth FROM (SELECT 	case when date_part('week', he_examdate) = date_part('week', current_date) then 1 else 0 end as perweek, ") \
			_T(" case when date_part('month', he_examdate) = date_part('month', current_date) then 1 else 0 end as permonth ") \
			_T(" FROM hms_exam ") \
			_T(" WHERE he_patientno=%ld ) as tbl"), m_nPatientNo);
		rs.ExecSQL(szSQL);
		if(!rs.IsEOF())
		{
			rs.GetValue(_T("perweek"), m_nExaminePerWeek);
			rs.GetValue(_T("permonth"), m_nExaminePerMonth);
		}
		if(m_szSuggesstion == _T("R")){
			szSQL.Format(_T("SELECT hre_date FROM hms_reexam WHERE hre_docno=%ld "), m_nDocumentNo);
			int ret = rs.ExecSQL(szSQL);
			
			m_bAppointReexamine = TRUE;
			if(!rs.IsEOF()){
				rs.GetValue(_T("hre_date"), m_szAppointReexamineDate);

			}
		}

		SetMode(VM_VIEW);

		if(!m_szCardNo.IsEmpty())
			m_wndCardNoButton.EnableWindow(true);
		OnExamListLoadData();
	
		if(m_nCardIdx > 0 && bInsExpiryFlag){
			CString szMsg, szLabel;
			TranslateString(_T("This card has expired"), szLabel);
			szMsg.Format(_T("%s. [%s]"), szLabel, CDate::Convert(m_sCardInfo.expdate));
			ShowMessageBox(szMsg);											   
		}
		
	}
	else
	{
		m_wndExamList.DeleteAllItems();
		SetMode(VM_NONE);		
	}
	
	OnLoadPatientImg(m_nDocumentNo);	
	
	UpdateData(false);

}
void CHMSRegistration::GetScreenToData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	int nMode = GetMode();
	

	bool bAddPat=false, bAddDoc=false, bAddExam=false;
	CString szSurName, szMidName, szFirstName, szSQL;
	CString tmpStr, szYearofBirth;

	SplitName(m_szPatientName, szSurName, szMidName, szFirstName);
	m_szDept = pMF->m_szDept;

	if(nMode==VM_ADDPAT)
	{
		bAddPat = true;
		bAddDoc = true;
		bAddExam = true;
	}
	else if(nMode == VM_ADDDOC)
	{
		bAddDoc = true;
		bAddExam = true;
	}
	else if(nMode == VM_ADDEXAM){
		bAddExam = true;
	}
//Them benh nhan moi
	if(bAddPat)
	{
		m_hms_patientTbl.SetValue(_T("hp_createdby"), pMF->GetCurrentUser());
		m_hms_patientTbl.SetValue(_T("hp_createddate"), pMF->GetSysDateTime());
		m_hms_patientTbl.SetValue(_T("hp_updatedby"), pMF->GetCurrentUser());
		m_hms_patientTbl.SetValue(_T("hp_updateddate"), pMF->GetSysDateTime());
//Lay ma benh nhan moi
		
		tmpStr.Format(_T("%ld"), m_nPatientNo);
		m_hms_patientTbl.SetValue(_T("hp_patientid"), tmpStr);
		m_hms_patientTbl.SetValue(_T("hp_surname"), szSurName);
		m_hms_patientTbl.SetValue(_T("hp_midname"), szMidName); 
		m_hms_patientTbl.SetValue(_T("hp_firstname"), szFirstName); 
		m_hms_patientTbl.SetValue(_T("hp_birthdate"), m_szBirthDate); 
//		m_hms_patientTbl.SetValue(_T("hp_age"), m_szAge); 
		m_hms_patientTbl.SetValue(_T("hp_sex"), m_szSexKey); 
		m_hms_patientTbl.SetValue(_T("hp_ethnic"), m_szEthnicKey); 
		m_hms_patientTbl.SetValue(_T("hp_provid"), m_szProvillKey); 
		m_hms_patientTbl.SetValue(_T("hp_distid"), m_szDistrictKey); 
		m_hms_patientTbl.SetValue(_T("hp_villid"), m_szVillageKey); 
		m_hms_patientTbl.SetValue(_T("hp_dtladdr"), m_szDetailAddress);
		m_hms_patientTbl.SetValue(_T("hp_status"), _T("A"));
		m_hms_patientTbl.SetValue(_T("hp_occupation"), m_szOccupationKey); 
		m_hms_patientTbl.SetValue(_T("hp_workplace"), m_szWorkingPlace); 
		m_hms_patientTbl.SetValue(_T("hp_workplaceid"), _T("")); 
		m_hms_patientTbl.SetValue(_T("hp_rank"), m_szRankKey); 
		m_hms_patientTbl.SetValue(_T("hp_position"), m_szPositionKey);
		m_hms_patientTbl.SetValue(_T("hp_cmnd"), m_szCMND); 
		m_hms_patientTbl.SetValue(_T("hp_cmnddate"), m_szNgaycapCMND); 
		szYearofBirth = m_bYearofBirth?_T("Y"):_T("N");
		m_hms_patientTbl.SetValue(_T("hp_yearofbirth"), szYearofBirth);
		m_hms_patientTbl.SetValue(_T("hp_nationality"), m_szNationality);

		

	}
//Sua thong tin cua benh nhan
	else if(nMode==VM_EDIT)
	{
		m_hms_patientTbl.SetValue(_T("hp_updatedby"), pMF->GetCurrentUser());
		m_hms_patientTbl.SetValue(_T("hp_updateddate"), pMF->GetSysDateTime());
		m_hms_patientTbl.SetValue(_T("hp_patientno"), m_nPatientNo);
		m_hms_patientTbl.SetValue(_T("hp_patientid"), _T(""));
		m_hms_patientTbl.SetValue(_T("hp_surname"), szSurName);
		m_hms_patientTbl.SetValue(_T("hp_midname"), szMidName); 
		m_hms_patientTbl.SetValue(_T("hp_firstname"), szFirstName); 
		m_hms_patientTbl.SetValue(_T("hp_birthdate"), m_szBirthDate); 
	//	m_hms_patientTbl.SetValue(_T("hp_age"), m_szAge); 
		m_hms_patientTbl.SetValue(_T("hp_sex"), m_szSexKey); 
		m_hms_patientTbl.SetValue(_T("hp_ethnic"), m_szEthnicKey); 
		m_hms_patientTbl.SetValue(_T("hp_provid"), m_szProvillKey); 
		m_hms_patientTbl.SetValue(_T("hp_distid"), m_szDistrictKey); 
		m_hms_patientTbl.SetValue(_T("hp_villid"), m_szVillageKey); 
		m_hms_patientTbl.SetValue(_T("hp_dtladdr"), m_szDetailAddress);
		m_hms_patientTbl.SetValue(_T("hp_occupation"), m_szOccupationKey); 
		m_hms_patientTbl.SetValue(_T("hp_workplace"), m_szWorkingPlace); 
		m_hms_patientTbl.SetValue(_T("hp_workplaceid"), _T("")); 
		m_hms_patientTbl.SetValue(_T("hp_rank"), m_szRankKey); 
		m_hms_patientTbl.SetValue(_T("hp_position"), m_szPositionKey);
		m_hms_patientTbl.SetValue(_T("hp_cmnd"), m_szCMND); 
		m_hms_patientTbl.SetValue(_T("hp_cmnddate"), m_szNgaycapCMND); 
		szYearofBirth = m_bYearofBirth?_T("Y"):_T("N");
		m_hms_patientTbl.SetValue(_T("hp_yearofbirth"), szYearofBirth);
		m_hms_patientTbl.SetValue(_T("hp_nationality"), m_szNationality);

	}

	tmpStr.Format(_T("%s%s%s"), szSurName.Left(1), szMidName.Left(1), szFirstName.Left(1));	
	m_szNameKey = tmpStr.MakeLower();	
	m_hms_patientTbl.SetValue(_T("hp_namekey"), m_szNameKey); 

	m_szCardNo.MakeUpper();
	if(m_szCardNo.IsEmpty())
	{
		CString szObjectType = m_wndObject.GetCurrent(3);
		if(szObjectType == _T("D") || szObjectType == _T("C") )
			m_nDisrate = ToInt(m_wndObject.GetCurrent(4));
		if(m_szOffLine == _T("Y") && pMF->m_nInsOffLinePayment > 0)
				m_nDisrate = pMF->m_nInsOffLinePayment;

	}

	//Tao ho so kham moi
	if(bAddDoc){
		//Lay so ho so moi
		m_hms_docTbl.SetValue(_T("hd_createdby"), pMF->GetCurrentUser());
		m_hms_docTbl.SetValue(_T("hd_createddate"), pMF->GetSysDateTime());
		m_hms_docTbl.SetValue(_T("hd_updatedby"), pMF->GetCurrentUser());
		m_hms_docTbl.SetValue(_T("hp_updateddate"), pMF->GetSysDateTime());
		m_hms_docTbl.SetValue(_T("hd_patientno"), m_nPatientNo); 
		m_hms_docTbl.SetValue(_T("hd_docno"), m_nDocumentNo); 
		m_hms_docTbl.SetValue(_T("hd_status"), _T("O")); 
		m_hms_docTbl.SetValue(_T("hd_telephone"), m_szPhone); 
		m_hms_docTbl.SetValue(_T("hd_relative"), m_szRelative); 
		m_hms_docTbl.SetValue(_T("hd_relation"), m_szIntroductionKey); 
		m_hms_docTbl.SetValue(_T("hd_contactaddr"), m_szContactAddress); 
		m_hms_docTbl.SetValue(_T("hd_contacttel"), m_szPhone); 
		m_hms_docTbl.SetValue(_T("hd_object"), m_szObjectKey); 
		m_hms_docTbl.SetValue(_T("hd_cardno"), m_szCardNo); 
		m_hms_docTbl.SetValue(_T("hd_cardidx"), m_nCardIdx); 
		m_hms_docTbl.SetValue(_T("hd_insregdate	"), m_szExamDate); 
		
		m_hms_docTbl.SetValue(_T("hd_disrate"), m_nDisrate); 
		m_hms_docTbl.SetValue(_T("hd_insline"), m_szOffLine); 
		m_hms_docTbl.SetValue(_T("hd_emergency"), m_szEmergency); 
		m_szOver5Year = m_bOver5years?_T("Y"):_T("N");
		m_hms_docTbl.SetValue(_T("hd_over5year"), m_szOver5Year); 
		m_hms_docTbl.SetValue(_T("hd_over5yeardate"), m_szDateOver5year);	
		m_hms_docTbl.SetValue(_T("hd_datediscountall"), m_szDateDiscount); 
		
		m_hms_docTbl.SetValue(_T("hd_admitdept"), m_szDept);
		m_hms_docTbl.SetValue(_T("hd_admitstate"), m_szPatientStateKey); 
		tmpStr.Format(_T("%s %s"), m_szExamDate, pMF->GetSysTime());
		m_hms_docTbl.SetValue(_T("hd_admitdate"), tmpStr); 
		m_hms_docTbl.SetValue(_T("hd_transplace"), m_wndHospital.GetCurrent(1)); 
		m_hms_docTbl.SetValue(_T("hd_transdiagn"), m_szDisease); 
		m_hms_docTbl.SetValue(_T("hd_transplaceid"), m_szHospital); 
		m_hms_docTbl.SetValue(_T("hd_ma_doituong_kcb"), m_szDoituongkcb);
		
		m_hms_docTbl.SetValue(_T("hd_xobject"), m_sCardInfo.xobject); 
		m_hms_docTbl.SetValue(_T("hd_xcardno"), m_sCardInfo.xCardno); 
		m_hms_docTbl.SetValue(_T("hd_xissuedate"), m_sCardInfo.xIssueDate); 
		m_hms_docTbl.SetValue(_T("hd_xissueplace"), m_sCardInfo.xIssuePlace); 
		if(m_bAppointReexamine)
			m_szAppointReexanmine= _T("Y");
		else 
			m_szAppointReexanmine= _T("N");

		m_hms_docTbl.SetValue(_T("hd_reexam"), m_szAppointReexanmine); 

	//	m_hms_docTbl.SetValue(_T("hd_transicd"), m_szDisease); 
		
	}
	//Sua thong tin ho so kham
	else if(nMode==VM_EDIT){
		m_hms_docTbl.SetValue(_T("hd_updatedby"), pMF->GetCurrentUser());
		m_hms_docTbl.SetValue(_T("hd_updateddate"), pMF->GetSysDateTime());
		m_hms_docTbl.SetValue(_T("hd_patientno"), m_nPatientNo); 
		m_hms_docTbl.SetValue(_T("hd_docno"), m_nDocumentNo); 
		m_hms_docTbl.SetValue(_T("hd_status"), _T("O")); 
		m_hms_docTbl.SetValue(_T("hd_telephone"), m_szPhone); 
		m_hms_docTbl.SetValue(_T("hd_relative"), m_szRelative); 
		m_hms_docTbl.SetValue(_T("hd_relation"), m_szIntroductionKey); 
		m_hms_docTbl.SetValue(_T("hd_contactaddr"), m_szContactAddress); 
		m_hms_docTbl.SetValue(_T("hd_contacttel"), m_szPhone); 
		m_hms_docTbl.SetValue(_T("hd_admitstate"), m_szPatientStateKey); 
		m_hms_docTbl.SetValue(_T("hd_object"), m_szObjectKey); 
		m_hms_docTbl.SetValue(_T("hd_cardno"), m_szCardNo); 
		m_hms_docTbl.SetValue(_T("hd_cardidx"), m_nCardIdx); 
		m_hms_docTbl.SetValue(_T("hd_disrate"), m_nDisrate); 
		m_hms_docTbl.SetValue(_T("hd_insline"), m_szOffLine); 
		m_hms_docTbl.SetValue(_T("hd_emergency"), m_szEmergency);
		
		m_szOver5Year = m_bOver5years?_T("Y"):_T("N");
		m_hms_docTbl.SetValue(_T("hd_over5year"), m_szOver5Year); 
		m_hms_docTbl.SetValue(_T("hd_over5yeardate"), m_szDateOver5year); 
		m_hms_docTbl.SetValue(_T("hd_datediscountall"), m_szDateDiscount); 
		
		m_hms_docTbl.SetValue(_T("hd_admitdept"), m_szDept); 
		tmpStr.Format(_T("%s %s"), m_szExamDate, pMF->GetSysTime());
		m_hms_docTbl.SetValue(_T("hd_admitdate"), tmpStr);
		m_hms_docTbl.SetValue(_T("hd_ma_doituong_kcb"), m_szDoituongkcb);

		m_hms_docTbl.SetValue(_T("hd_transplace"), m_wndHospital.GetCurrent(1)); 
		m_hms_docTbl.SetValue(_T("hd_transdiagn"), m_szDisease); 
		m_hms_docTbl.SetValue(_T("hd_transplaceid"), m_szHospital); 
		if(m_bAppointReexamine)
			m_szAppointReexanmine= _T("Y");
		else 
			m_szAppointReexanmine= _T("N");

		m_hms_docTbl.SetValue(_T("hd_reexam"), m_szAppointReexanmine); 
	//	m_hms_docTbl.SetValue(_T("hd_transicd"), m_szDisease); 

	}
	
	

	if(!m_szCardNo.IsEmpty()){
		m_hms_cardTbl.SetValue(_T("hc_createdby"), pMF->GetCurrentUser()); 
		m_hms_cardTbl.SetValue(_T("hc_createddate"), pMF->GetSysDateTime()); 
		m_hms_cardTbl.SetValue(_T("hc_updatedby"), pMF->GetCurrentUser()); 
		m_hms_cardTbl.SetValue(_T("hc_updateddate"), pMF->GetSysDateTime()); 
		m_hms_cardTbl.SetValue(_T("hc_patientno"), m_nPatientNo); 
		m_hms_cardTbl.SetValue(_T("hc_cardno"), m_szCardNo); 
		m_hms_cardTbl.SetValue(_T("hc_idx"), m_nCardIdx); 
		m_hms_cardTbl.SetValue(_T("hc_regdate"), m_sCardInfo.regdate); 
		m_hms_cardTbl.SetValue(_T("hc_expdate"), m_sCardInfo.expdate); 
		m_hms_cardTbl.SetValue(_T("hc_regcode"), m_sCardInfo.regplacecde); 
		if(m_sCardInfo.code.IsEmpty())
			m_sCardInfo.code = pMF->m_szCode;
		m_hms_cardTbl.SetValue(_T("hc_company"), m_sCardInfo.company); 
		m_hms_cardTbl.SetValue(_T("hc_code"), m_sCardInfo.code);		
		m_hms_cardTbl.SetValue(_T("hc_discount"), m_sCardInfo.discount);
		m_hms_cardTbl.SetValue(_T("hc_groupid"), m_sCardInfo.groupid);
		m_hms_cardTbl.SetValue(_T("hc_area"), m_sCardInfo.szArea);
		_tprintf(_T("\r\nRegAreaCode:%s"), m_sCardInfo.szArea);
		m_hms_cardTbl.SetValue(_T("hc_active"), _T("Y"));
		m_hms_docTbl.SetValue(_T("hd_cardidx"), m_nCardIdx); 
	}
	else
	{
		m_nCardIdx = 0;
		m_hms_docTbl.SetValue(_T("hd_cardno"), _T("")); 
		m_hms_docTbl.SetValue(_T("hd_cardidx"), 0); 
		//m_hms_docTbl.SetValue(_T("hd_disrate"), 0); 
		m_hms_docTbl.SetValue(_T("hd_insline"), _T("N")); 

	}
	
	if((bAddExam) || nMode == VM_EDIT){
		
		m_hms_examTbl.SetValue(_T("he_createdby"), pMF->GetCurrentUser());
		m_hms_examTbl.SetValue(_T("he_createddate"), pMF->GetSysDateTime());

		m_hms_examTbl.SetValue(_T("he_updatedby"), pMF->GetCurrentUser());
		m_hms_examTbl.SetValue(_T("he_updateddate"), pMF->GetSysDateTime());

		m_hms_examTbl.SetValue(_T("he_patientno"), m_nPatientNo); 
		m_hms_examTbl.SetValue(_T("he_docno"), m_nDocumentNo); 
		m_hms_examTbl.SetValue(_T("he_roomid"), m_szRoomKey); 
		m_hms_examTbl.SetValue(_T("he_deptid"), pMF->m_szDept); 
		m_hms_examTbl.SetValue(_T("he_receptno"), m_nReceptNo); 
		m_hms_examTbl.SetValue(_T("he_receptidx"), m_nReceptIdx); 
		tmpStr.Format(_T("%s %s"), m_szExamDate, pMF->GetSysTime());
		m_hms_examTbl.SetValue(_T("he_examdate"), tmpStr); 
		m_hms_examTbl.SetValue(_T("he_status"), m_szExamStatus);
		tmpStr.Format(_T("D0000%.3d"), ToInt(m_szExamTypeKey));
		m_hms_examTbl.SetValue(_T("he_examtype"), tmpStr);
		if(bAddExam) 
			m_hms_examTbl.SetValue(_T("he_hasfee"), _T("Y")); 

	}

}
void CHMSRegistration::SetDefaultValues(){	
	m_szCardNoFind.Empty();
	m_szCurCardNo.Empty();
	m_szPatientName.Empty();
	m_szAge.Empty();
	m_szBirthDate.Empty();
	m_szSexKey = _T("M");
	m_szEthnicKey = _T("1");
	m_szOccupationKey.Empty();
	m_szAddressKey.Empty();
	m_szDetailAddress.Empty();	
	m_szProvillKey.Empty();
	m_szDistrictKey.Empty();
	m_szVillageKey.Empty();	
	m_szWorkingPlace.Empty();
	m_szRankKey.Empty();
	m_szPositionKey.Empty();
	m_szIntroductionKey.Empty();
	m_szRelative.Empty();
	m_szPhone.Empty();
	m_szContactAddress.Empty();
	m_szDoituongkcb.Empty();
	m_szCMND.Empty();
	m_szNgaycapCMND.Empty();

	m_bAllowAddCard = true;
	m_bYearofBirth = false;
	int nMode = GetMode();
	switch(nMode){
	case VM_ADDPAT:
	case VM_ADDDOC:
	case VM_NONE:
		m_szObjectKey.Empty();
		m_szCardNo.Empty();
		m_szPatientStateKey = _T("A");
		m_szHospital.Empty();
		m_szDisease.Empty();
		break;
	};
	
	if(GetMode() == VM_ADDPAT || GetMode() == VM_NONE)
	{
		m_nDisrate = 0;
		m_szOffLine = _T("N");
	}
	m_szExamDate.Empty();
	m_szExamTypeKey.Empty();
	m_szRoomKey.Empty();

	m_sCardInfo.code.Empty();
	m_sCardInfo.company.Empty();
	m_sCardInfo.discount = 0;
	m_sCardInfo.expdate.Empty();
	m_sCardInfo.groupid=0;
	m_sCardInfo.regdate.Empty();
	m_sCardInfo.regplacecde.Empty();
	m_sCardInfo.szArea.Empty();
	m_sCardInfo.xCardno.Empty();
	m_sCardInfo.xobject.Empty();
	m_sCardInfo.xIssueDate.Empty();
	m_sCardInfo.xIssuePlace.Empty();
	

	m_sCardInfoBarcode.szPatientName.Empty();
	m_sCardInfoBarcode.nDiscount = 0;
	m_sCardInfoBarcode.szCardNo.Empty();
	m_sCardInfoBarcode.szExpdate.Empty();
	m_sCardInfoBarcode.szRegdate.Empty();
	m_nExaminePerMonth =0;
	m_nExaminePerWeek =0;	

}
int CHMSRegistration::SetMode(int nMode){ 
		int nRow;
 		int nOldMode = GetMode(); 
 		CGuiView::SetMode(nMode); 
 		CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd(); 
 		CString szSQL; 
 		CRecord rs(&pMF->m_db);		
	
  		switch(nMode){ 
 		case VM_ADDPAT: 
			if(!pMF->CheckPermission(_T("01.01")))
			{
				ShowMessageBox(_T("Permission Denined."), 0);
				return 0;
			}

 			EnableControls(TRUE); 
 			EnableButtons(TRUE, 0, 5, 6, -1); 
 			SetDefaultValues();
			
			m_nPatientNo = m_nDocumentNo = 0;
			m_szExamDate = pMF->GetSysDate();
			pMF->SetStatusText(_T("Add new patient"));
			m_wndExamList.DeleteAllItems();
			if(pMF->m_szAllowInputDate == _T("Y")){
				m_wndExamDate.ModifyStyle(0, WS_TABSTOP);
				m_wndExamDate.EnableWindow(true);
			}

			m_szProvillKey.Format(_T("%d"), pMF->m_CompanyInfo.sc_provid);
			m_nDisrate = 0;
			m_szOffLine = _T("N");
			m_wndHospital.SetCheckValue(false);
			m_wndDisease.SetCheckValue(false);
			m_szDisease.Empty();
			m_szNationality = _T("000");

 			break; 
		case VM_ADDDOC:
			if(!pMF->CheckPermission(_T("01.01")))
			{
				ShowMessageBox(_T("Permission Denined."), 0);
				return 0;
			}		


			// Kiem tra doi tuong BH so lan kham trong ngay
			nRow = OnCheckNumberExamToday();
			if(nRow > 0)		
			{
				CString szMsg;
				szMsg.Format(_T("\x42\x1EC7nh nh\xE2n \x111\xE3 kh\xE1m [%\x64] trong ng\xE0y. \x42\x1EA1n \x63\xF3 mu\x1ED1n t\x1EA1o h\x1ED3 s\x1A1 kh\xE1m m\x1EDBi kh\xF4ng?"), nRow);
				if(ShowMessageBox(szMsg, MB_YESNO|MB_ICONWARNING) != IDYES)
					return -1;
			}

			m_wndObject.EnableWindow(TRUE);
			
			m_wndPatientState.EnableWindow(TRUE);
			m_wndRoom.EnableWindow(TRUE);
			m_wndExamType.EnableWindow(TRUE);
			m_wndHospital.EnableWindow(TRUE);
			m_wndDisease.EnableWindow(TRUE);
 			EnableButtons(TRUE, 0, 5, 6, -1); 
			m_szExamDate = pMF->GetSysDate();
			m_wndExamType.SetFocus();
			pMF->SetStatusText(_T("Add new document"));
			m_nDocumentNo = 0;
			m_wndExamList.DeleteAllItems();
			if(pMF->m_szAllowInputDate == _T("Y")){
				m_wndExamDate.ModifyStyle(0, WS_TABSTOP);
				m_wndExamDate.EnableWindow(true);
			}

			m_szOffLine = _T("N");
			m_bAppointReexamine= false;
			m_bYearofBirth = false;

			break;
		case VM_ADDEXAM:
			if(!pMF->CheckPermission(_T("01.01")))
			{
				ShowMessageBox(_T("Permission Denined."), 0);
				return 0;
			}
			m_wndRoom.EnableWindow(TRUE);
			m_wndExamType.EnableWindow(TRUE);
 			EnableButtons(TRUE, 0, 5, 6, -1); 
			m_szExamDate = pMF->GetSysDate();
			m_wndExamType.SetFocus();
			m_szExamTypeKey.Empty();
			m_szRoomKey.Empty();
			m_bYearofBirth = false;

			if(pMF->m_szAllowInputDate == _T("Y")){
				m_wndExamDate.ModifyStyle(0, WS_TABSTOP);
				m_wndExamDate.EnableWindow(true);
			}
			pMF->SetStatusText(_T("Add new examination receipt"));
			break;
 		case VM_EDIT: 
			if(!pMF->CheckPermission(_T("01.02")))
			{
				ShowMessageBox(_T("Permission Denined."), 0);
				return 0;
			}
 			EnableControls(TRUE); 
 			EnableButtons(TRUE, 0, 5, 6, -1); 
			if(pMF->m_szAllowInputDate == _T("Y")){
				m_wndExamDate.ModifyStyle(0, WS_TABSTOP);
				m_wndExamDate.EnableWindow(true);
			}
			
			if(m_szExamStatus != _T("O"))
			{
				m_wndExamDate.SetCheckValue(false);
				m_wndExamDate.EnableWindow(false);

			}
			szSQL.Format(_T("SELECT count(*) ") \
				_T("FROM hmsv_fee ") \
				_T("WHERE hfe_docno=%ld and hfe_deptid='%s' ") \
				_T(" and hfe_roomid=%d and hfe_type='E' and hfe_status ='P' ") \
				_T(" and hfe_idx='%s' "),
				m_nDocumentNo, pMF->m_szDept, str2int(m_szRoomKey), m_szExamTypeKey);

			rs.ExecSQL(szSQL);

			if(rs.GetIntValue() > 0)
			{
				m_wndExamType.EnableWindow(false);
				m_wndRoom.EnableWindow(false);
				m_wndObject.EnableWindow(false);
				m_wndExamDate.EnableWindow(false);
			}
			pMF->SetStatusText(_T("Edit patient information"));
 			break; 
 		case VM_VIEW: 
 			EnableControls(FALSE); 
 			EnableButtons(FALSE, 0, 5, 6, -1); 
			pMF->SetStatusText(_T("View information of patient"));
 			break; 
 		case VM_NONE: 
 			EnableControls(FALSE); 
 			EnableButtons(TRUE, 2,-1); 
 			SetDefaultValues(); 
			pMF->SetStatusText(_T("Ready"));
			m_wndExamList.DeleteAllItems();
 			break; 
 		}; 

		if(nMode != VM_VIEW && nMode != VM_NONE){
			m_wndPatientNo.EnableWindow(FALSE);
			m_wndDocumentNo.EnableWindow(FALSE);
			m_wndCardNoFind.EnableWindow(FALSE);
			m_wndPatientNameFind.EnableWindow(FALSE);
			m_wndPatientName.SetFocus();
		}
		else
		{
			m_wndPatientNo.EnableWindow(TRUE);
			m_wndDocumentNo.EnableWindow(TRUE);
			m_wndCardNoFind.EnableWindow(TRUE);
			m_wndPatientNameFind.EnableWindow(TRUE);
			m_wndDocumentNo.SetFocus();
		}
		
		if(pMF->m_szObjectInsurance != _T("Y"))
		{
			m_szObjectKey =_T("9");
			m_nDisrate = 0;			
			m_szCardNo.Empty();
			m_wndObject.EnableWindow(FALSE);
			m_wndCardNoButton.EnableWindow(FALSE);
		}

 		UpdateData(FALSE); 
		 		
		if(!m_szCardNo.IsEmpty())
			OnObjectSelendok();

 		return nOldMode; 
 } 
int CHMSRegistration::OnRoomListDblClick(){
	 return 0;
} 
int CHMSRegistration::OnRoomListSelectChange(int nOldItem, int nNewItem){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 
int CHMSRegistration::OnRoomListDeleteItem(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 
int CHMSRegistration::OnRoomListLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL, szName, tmpStr;
	
	szSQL.Format(_T(" SELECT hrl_id, hrl_name as name, sum(reg) as reg,sum(BH) as BH, sum(examed) as examed, sum(reg-examed) as remain") \
					_T(" FROM ") \
					_T(" ( ") \
					_T(" SELECT") \
					_T(" 	he_deptid,") \
					_T(" 	he_roomid,") \
					_T("	case when length(hd_cardno) >=15 then 1 else 0 end as BH, ") \
					_T(" 	1 as reg,") \
					_T(" 	case when he_status<>'O' then 1 else 0 end as examed") \
					_T(" FROM") \
					_T(" 	hms_exam") \
					_T("	LEFT JOIN hms_doc ON (hd_docno=he_docno) ") \
					_T(" WHERE trim(he_deptid)='%s' and date(he_examdate) = current_date") \
					_T(" ) AS Tbl") \
					_T(" LEFT JOIN hms_roomlist ON(hrl_deptid=he_deptid AND hrl_id=he_roomid)") \
					_T(" WHERE hrl_id > 0 ") \
					_T(" GROUP BY he_deptid, he_roomid, hrl_id, hrl_name") \
					_T(" ORDER BY he_deptid, he_roomid"), pMF->m_szDept);
//_fmsg(_T("%s"), szSQL);

	m_wndRoomList.BeginLoad(); 
	int nCount = 0;
	int nReg =0, nExamed=0,nBh=0;
	nCount = rs.ExecSQL(szSQL);
	while(!rs.IsEOF()){ 
		nReg += ToInt(rs.GetValue(_T("reg")));
		nExamed += ToInt(rs.GetValue(_T("examed")));
		nBh += ToInt(rs.GetValue(_T("BH")));
		
		rs.GetValue(_T("name"), tmpStr);
		tmpStr.Replace(_T("Phòng Khám"), _T("PK"));
		tmpStr.Replace(_T("Phòng khám"), _T("PK"));
		tmpStr.Replace(_T("phòng khám"), _T("PK"));

		szName.Format(_T("%s.%s"), rs.GetValue(_T("hrl_id")), tmpStr);

		m_wndRoomList.AddItems(
			szName,
			rs.GetValue(_T("reg")),
			rs.GetValue(_T("BH")),
			rs.GetValue(_T("examed")), 
			NULL);
		rs.MoveNext();
	}
	CString szLabel, szTotalReg, szTotalExamed,szTotalBH;
	TranslateString(_T("Total"), szLabel);
	szTotalReg.Format(_T("%d"), nReg);
	szTotalExamed.Format(_T("%d"), nExamed);
	szTotalBH.Format(_T("%d"),nBh);
	nCount = m_wndRoomList.AddItems(szLabel, szTotalReg,szTotalBH, szTotalExamed, NULL);
	m_wndRoomList.SetItemBkColor(nCount, RGB(64, 128, 128), false);
	m_wndRoomList.SetItemTextColor(nCount, RGB(255, 255, 255), false);

	m_wndRoomList.EndLoad();
	
	return nCount;
}
void CHMSRegistration::OnExamListDblClick(){
	
} 
void CHMSRegistration::OnExamListSelectChange(int nOldItem, int nNewItem){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CString szSQL;
	CRecord rs(&pMF->m_db);

	if (nNewItem < 0)
		return;

	if(GetMode() != VM_VIEW){
	//	SetMode(VM_NONE);
	}
	m_nDocumentNo = ToLong(m_wndExamList.GetItemText(nNewItem, 0));
	m_nReceptIdx = ToInt(m_wndExamList.GetItemText(nNewItem, 6));

	szSQL.Format(_T("SELECT * FROM hms_doc WHERE hd_docno=%ld"), m_nDocumentNo);
	rs.ExecSQL(szSQL);
	if(!rs.IsEOF()){
		rs.GetValue(_T("hd_docno"), m_nDocumentNo); 
	//	rs.GetValue(_T("hd_status"), m_szStatus); 
		rs.GetValue(_T("hd_telephone"), m_szPhone); 
		rs.GetValue(_T("hd_relative"), m_szRelative); 
		rs.GetValue(_T("hd_relation"), m_szIntroductionKey); 
		rs.GetValue(_T("hd_contactaddr"), m_szContactAddress); 
		rs.GetValue(_T("hd_transplace"), m_szHospital); 
		rs.GetValue(_T("hd_transdiagn"), m_szDisease); 
		rs.GetValue(_T("hd_admitstate"), m_szPatientStateKey); 
		rs.GetValue(_T("hd_object"), m_szObjectKey); 

		rs.GetValue(_T("hd_cardno"), m_szCardNo); 
		m_szCurCardNo = m_szCardNo;
		rs.GetValue(_T("hd_admitdate"), m_szExamDate); 
		rs.GetValue(_T("hd_admitdept"), m_szDept);
		rs.GetValue(_T("hd_status"), m_szDocStatus);
		rs.GetValue(_T("hd_cardidx"), m_nCardIdx);
		rs.GetValue(_T("hd_insline"),m_szOffLine);
		rs.GetValue(_T("hd_emergency"),m_szEmergency);
		

		
		m_nCardIdxOld = m_nCardIdx;
		m_szCardNoOld = m_szCardNo;

		rs.GetValue(_T("hd_reexam"),m_szAppointReexanmine);
		 if(m_szAppointReexanmine== _T("Y"))
			 m_bAppointReexamine= true;
		 else 
			 m_bAppointReexamine= false ;
        
		/*if(m_szOffLine == _T("Y"))
			m_wndCardNo.SetTextColor(RGB(255, 0, 0));
		else
			m_wndCardNo.SetTextColor(RGB(0, 0, 255));*/
		
		CString tmpStr;
		rs.GetValue(_T("hd_transplaceid"), m_szHospital); 
		if(m_szHospital.IsEmpty())
		{
			rs.GetValue(_T("hd_transplace"), tmpStr);
			m_wndHospital.SetCurrent(1, tmpStr);
		}

//if has card the load informations of card
//Neu co the thi load cac thong tin the ra
		if(!m_szCardNo.IsEmpty()){
			szSQL.Format(_T("SELECT * FROM hms_card WHERE hc_patientno=%ld AND hc_cardno='%s' AND hc_idx=%d"), m_nPatientNo, m_szCardNo, m_nCardIdx);
			rs.ExecSQL(szSQL);
			if(!rs.IsEOF()){
				rs.GetValue(_T("hc_regdate"), m_sCardInfo.regdate); 
				rs.GetValue(_T("hc_expdate"), m_sCardInfo.expdate); 
				rs.GetValue(_T("hc_regcode"), m_sCardInfo.regplacecde); 
				rs.GetValue(_T("hc_company"), m_sCardInfo.company); 
				rs.GetValue(_T("hc_code"), m_sCardInfo.code); 
				rs.GetValue(_T("hc_discount"), m_sCardInfo.discount);
			}
		}
		szSQL.Format(_T("SELECT * FROM hms_exam WHERE he_docno=%ld AND he_receptidx=%d"), m_nDocumentNo, m_nReceptIdx);
		rs.ExecSQL(szSQL);
		if(!rs.IsEOF()){
			rs.GetValue(_T("he_roomid"), m_szRoomKey); 
			m_szCurRoom = m_szRoomKey;
			rs.GetValue(_T("he_receptno"), m_nReceptNo); 
			rs.GetValue(_T("he_receptidx"), m_nReceptIdx); 
			rs.GetValue(_T("he_examdate"), m_szExamDate); 
			rs.GetValue(_T("he_status"), m_szExamStatus); 
			CString tmpStr;
			rs.GetValue(_T("he_examtype"), tmpStr);
			m_szExamTypeKey.Format(_T("%d"), ToInt(tmpStr.Right(3)));
			m_szExamType = tmpStr;
			rs.GetValue(_T("he_hasfee"), m_szHasFee); 
			rs.GetValue(_T("he_payment"), m_szPayment); 
			m_szSheetNo.Format(_T("%s.%d"), m_szRoomKey, m_nReceptNo);
		}


		CGuiView::SetMode(VM_VIEW);
		UpdateData(false);
		if(!m_szCardNo.IsEmpty())
			m_wndCardNoButton.EnableWindow(true);
	
	}
	return;
	//Lay du lieu cac phieu kham benh
	if(m_nReceptIdx > 0){
		CRecord rs(&pMF->m_db);
		CString szSQL, szWhere;
		szSQL.Format(_T("SELECT * FROM hms_exam WHERE he_docno=%ld AND he_receptidx=%d"), m_nDocumentNo, m_nReceptIdx);
		rs.ExecSQL(szSQL);
		if(!rs.IsEOF()){
			rs.GetValue(_T("he_roomid"), m_szRoomKey); 
			rs.GetValue(_T("he_receptno"), m_nReceptNo); 
			rs.GetValue(_T("he_receptidx"), m_nReceptIdx); 
			rs.GetValue(_T("he_examdate"), m_szExamDate); 
			rs.GetValue(_T("he_status"), m_szExamStatus); 
			CString tmpStr;
			rs.GetValue(_T("he_examtype"), tmpStr);
			m_szExamTypeKey.Format(_T("%d"), ToInt(tmpStr.Right(3)));

			rs.GetValue(_T("he_hasfee"), m_szHasFee); 
			rs.GetValue(_T("he_payment"), m_szPayment); 
			m_szSheetNo.Format(_T("%s.%d"), m_szRoomKey, m_nReceptNo);
			UpdateData(false);
		}
	}

} 
int CHMSRegistration::OnExamListDeleteItem(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CString szSQL;
	int nSel;
	nSel = m_wndExamList.GetCurSel();
	if(nSel < 0)
		return 0;
	OnDeleteHMSRegistration();
	return 0;
} 

int CHMSRegistration::OnExamListSetPriority(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	if(!pMF->CheckPermission(_T("01.04")))
	{
		ShowMessageBox(_T("Permission Denined."), 0);
		return 0;
	}

	CHMSPriorityDialog dlg(this);
	if(dlg.DoModal() == IDOK){
		
		CString szSQL;
		if(dlg.m_nLevel == 0)
		{
			szSQL.Format(_T("UPDATE hms_exam SET he_emergency='Y', he_priority=%d WHERE he_docno=%ld AND he_receptidx=%d"), dlg.m_nLevel, m_nDocumentNo, m_nReceptIdx);
			pMF->ExecSQL(szSQL);
			szSQL.Format(_T("UPDATE hms_doc SET hd_emergency='Y' WHERE hd_docno=%ld"), m_nDocumentNo);
			pMF->ExecSQL(szSQL);
		}
		else
		{
			szSQL.Format(_T("UPDATE hms_exam SET he_emergency='N', he_priority=%d WHERE he_docno=%ld AND he_receptidx=%d"), dlg.m_nLevel, m_nDocumentNo, m_nReceptIdx);
			pMF->ExecSQL(szSQL);
			szSQL.Format(_T("SELECT count(*) FROM hms_exam WHERE he_docno=%ld and he_emergency='Y' "), m_nDocumentNo);
			CRecord rs(&pMF->m_db);
			rs.ExecSQL(szSQL);
			if(rs.GetIntValue() <= 0)
			{
				szSQL.Format(_T("UPDATE hms_doc SET hd_emergency='N' WHERE hd_docno=%ld"), m_nDocumentNo);
				pMF->ExecSQL(szSQL);
			}
		}
		
	}
	return 0;
}
long CHMSRegistration::OnExamListLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL;
	m_wndExamList.BeginLoad(); 
	int nCount = 0;

	szSQL.Format(_T("select he_docno as docno, date(he_examdate) as examdate, ") \
	_T(" hrl_name as name, he_receptno as receptno, he_receptidx as receptidx, he_doctor as doctor, he_status as status, he_diagnostic as disease ") \
	_T("from hms_exam ") \
	_T("left join hms_roomlist on(hrl_deptid='%s' AND he_roomid = hrl_id) ") \
	_T("where he_patientno=%ld ") \
	_T(" order by he_docno DESC, he_roomid "), pMF->m_szDept, m_nPatientNo);

	nCount = rs.ExecSQL(szSQL);
	CString tmpStr;
	while(!rs.IsEOF()){ 
		rs.GetValue(_T("status"), tmpStr);
		if(tmpStr == _T("T"))
			tmpStr = pMF->GetStatusString(tmpStr, _T("Terminated"));
		else if(tmpStr != _T("O"))
			tmpStr = pMF->GetStatusString(tmpStr, _T("Examed"));
		else
			tmpStr = pMF->GetStatusString(tmpStr, _T("Waiting"));
		m_wndExamList.AddItems(
			rs.GetValue(_T("docno")), 
			rs.GetValue(_T("examdate")), 
			rs.GetValue(_T("name")), 
			rs.GetValue(_T("receptno")), 
			rs.GetValue(_T("doctor")), 
			tmpStr, 
			rs.GetValue(_T("receptidx")), 
			rs.GetValue(_T("disease")), 
			NULL);
		rs.MoveNext();
	}
	m_wndExamList.EndLoad(); 
	// m_wndExamList.SetCurSel(0);
	for (int i=0;i < m_wndExamList.GetItemCount();i++)
	{
		if(ToLong(m_wndExamList.GetItemText(i,0)) == m_nDocumentNo)
		{
			m_wndExamList.SetCurSel(i);
			break;
		}
	}
	return nCount;

} 
/*int CHMSRegistration::OnPatientNoSetfocus(){
	return 0;
} */
/*int CHMSRegistration::OnPatientNoKillfocus(){
	return 0;
} */
int CHMSRegistration::OnPatientNoCheckValue(){
	if(GetMode() != VM_VIEW && GetMode() != VM_NONE)
		return-1;
	UpdateData(true);
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CString tmpStr, szDate;
	tmpStr.Format(_T("%ld"), m_nPatientNo);
	if(tmpStr.GetLength() < 7){
		szDate = pMF->GetSysDate();
		tmpStr.Format(_T("%d%.7ld"), ToInt(szDate.Mid(2,2)), m_nPatientNo);
		m_nPatientNo = ToLong(tmpStr);
		
	}
	m_nDocumentNo = 0;
	UpdateData(false);
	m_wndPatientNo.SetSel(0, 8);
	GetDataToScreen();
//	m_wndRoomList.SetFocus();
	if(m_nPatientNo == 0){
		m_wndPatientNo.SetToolTipMessage(_T("Patient Not Found"));
		return -1;
	}
	return 1;
} 
/*int CHMSRegistration::OnDocumentNoChange(){
	return 0;
} */
int CHMSRegistration::OnDocumentNoSetfocus(){
	m_wndDocumentNo.SetSel(0, 8);
	return 0;
}
/*int CHMSRegistration::OnDocumentNoKillfocus(){
	return 0;
} */
int CHMSRegistration::OnDocumentNoCheckValue(){
	if(GetMode() != VM_VIEW && GetMode() != VM_NONE)
		return-1;
	if(m_wndDocumentNo.GetWindowTextLength() < 7)
		return 0;
	UpdateData(true);
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CString tmpStr, szDate;
	tmpStr.Format(_T("%ld"), m_nDocumentNo);

	if(tmpStr.GetLength() < 7){
		szDate = pMF->GetSysDate();
		tmpStr.Format(_T("%d%.7ld"), ToInt(szDate.Mid(2,2)), m_nDocumentNo);
		m_nDocumentNo = ToLong(tmpStr);		
	}
	m_nPatientNo = 0;
	UpdateData(false);
	m_wndDocumentNo.SetSel(0, 8);
	GetDataToScreen();
	if(m_nDocumentNo == 0){
		m_wndDocumentNo.SetToolTipMessage(_T("Patient Not Found"));
		return -1;
	}
	
	return 1;

} 
/*int CHMSRegistration::OnCardNoFindChange(){
	return 0;
} */
/*int CHMSRegistration::OnCardNoFindSetfocus(){
	return 0;
} */
/*int CHMSRegistration::OnCardNoFindKillfocus(){
	return 0;
} */

int CHMSRegistration::OnCardNoFindCheckValue(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CRecord rss(&pMF->m_db);
	CString szSQL;
	CString szData, szCardInfo, szCardFormat,  szCondition, szCode, szObjectID;
	CString szPatientName;
	CString szBirthDate;
	CString szSex;
	szPatientName.Empty();
	szBirthDate.Empty();
	szSex.Empty();
	

	if(m_szCardNoFind.GetLength() >= 10)
	{
		m_nError = 0;
		m_bOver5years = FALSE;
		m_bHasFeePaper = FALSE;
		m_szDateDiscountAll.Empty();
		m_szDateOver5year.Empty();
		//m_szCardNoFind.Empty();
		m_szCurCardNo.Empty();
		m_szPatientName.Empty();
		m_szAge.Empty();
		m_szBirthDate.Empty();
		m_szSexKey = _T("M");
		m_szEthnicKey = _T("1");

		
		m_szWorkingPlace.Empty();		
		m_szOccupationKey.Empty();
		m_szAddressKey.Empty();
		m_szProvillKey.Empty();
		m_szDistrictKey.Empty();
		m_szVillageKey.Empty();
		m_szDetailAddress.Empty();

		m_szRelative.Empty();
		m_szPhone.Empty();
		m_szContactAddress.Empty();
		m_bAllowAddCard = true;
		m_bOver5years = false;
		m_szWorkingPlace.Empty();
		m_szOffLine.Empty();
		m_szBirthDate.Empty();			
		m_bYearofBirth = false;
		
		m_szCardNo.Empty();
		m_szPatientStateKey = _T("A");
		m_szHospital.Empty();		
		m_szCMND.Empty();		
		m_szExamDate.Empty();

		m_sCardInfo.code.Empty();
		m_sCardInfo.company.Empty();
		m_sCardInfo.discount = 0;
		m_sCardInfo.expdate.Empty();
		m_sCardInfo.groupid=0;
		m_sCardInfo.hospitalid.Empty();
		m_sCardInfo.regdate.Empty();
		m_sCardInfo.regplacecde.Empty();
		m_sCardInfo.xCardno.Empty();
		m_sCardInfo.xobject.Empty();
		m_sCardInfo.xIssueDate.Empty();
		m_sCardInfo.xIssuePlace.Empty();
		m_sCardInfo.szArea.Empty();		
		m_sCardInfo.szBirthDate.Empty();
		m_sCardInfo.szSex.Empty();
		UpdateData(false);
	}

	int nDiscount = 0;
	int nGroupID;
//	int nRet;
	

	//Kiem tra tinh hop le cua the.
	if(m_szCardNoFind.GetLength() > 20)
	{
		CString szCCFind;
		CStringArray arInfo;
		ParseInsuranceCardInfo(m_szCardNoFind, arInfo);

		szCardInfo = m_szCardNoFind;
		szCCFind = m_szCardNoFind;

		if(arInfo.GetCount() == 11 || arInfo.GetCount() == 7 || arInfo.GetCount() == 5 )
		{
			CStringArray arInfocc;
			CStringToken tk(szCCFind, _T("|"), false);
			CString tmpStr;
			CString szText;
			CString szSex, szAge, szIDNo, szProvillKey, szDistrictKey, szVillageKey;

			int code_page = CP_UTF8;
			for (int i =0; i < tk.GetSize(); i++)
			{
				tk.GetAt(i, tmpStr);
				arInfocc.Add(tmpStr);
			}
			// The CCCD
			if(arInfo.GetCount() == 7 || arInfo.GetCount() == 11)
			{
				szPatientName = arInfocc[2];
				szIDNo = arInfocc[0];
				m_szCMND = arInfocc[1];

				tmpStr = arInfocc[4]; // gioi tinh
				if(tmpStr.MakeUpper() == _T("0"))
					szSex  = _T("M");
				else
					szSex  = _T("F");

				tmpStr = arInfocc[3]; // ngay sinh
				szBirthDate = tmpStr.Right(4)+ _T("/") + tmpStr.Mid(2,2)+ _T("/")  + tmpStr.Left(2);
				szSQL.Format(_T("hms_getage(current_date,'%s')"), szBirthDate);
				szAge = pMF->ExecDML(szSQL);

				CString szAddress;
				szAddress = arInfocc[5];
				szSQL.Format(_T("decode_address2('%s')"), szAddress);
				CString szCodeAddr = pMF->ExecDML(szSQL);
				
				CStringToken tkAddr(szCodeAddr, _T("."));
				tkAddr.GetAt(0, tmpStr);
				szProvillKey = tmpStr;
				tkAddr.GetAt(1,tmpStr );
				szDistrictKey = tmpStr;
				tkAddr.GetAt(2,tmpStr );
				szVillageKey = tmpStr;
			}
			else
			{
				szPatientName = arInfocc[1];
				szIDNo = arInfocc[0];
				m_szCMND = arInfocc[1];
				
				tmpStr = arInfocc[3]; // gioi tinh
				if(tmpStr.MakeUpper() == _T("NAM"))
					szSex  = _T("M");
				else
					szSex  = _T("F");

				tmpStr = arInfocc[2]; // ngay sinh
				//szBirthDate = tmpStr.Right(4)+ _T("/") + tmpStr.Mid(2,2)+ _T("/")  + tmpStr.Left(2);
				tmpStr.Replace(_T("-"), _T("/"));
				szBirthDate=tmpStr;
				szSQL.Format(_T("hms_getage(current_date,'%s')"), szBirthDate);
				szAge = pMF->ExecDML(szSQL);
			
			}	
			
			
			//m_szCMND = szIDNo;

			// Kiểm tra nếu có thông tin bn trong db thì lấy thông tin lần khám gần nhất ra
			szSQL.Format(_T("SELECT MAX(hd_docno) as docno ") \
				_T(" FROM hms_patient ") \
				_T(" LEFT JOIN hms_doc ON (hd_patientno = hp_patientno) ") \
				_T(" WHERE coalesce(hp_sin,'xxx') = '%s' or (coalesce(hp_cmnd, '') = '%s'  AND coalesce(hp_cmnd,'') <> '')"), szIDNo, m_szCMND);
			_tprintf(_T("\r\n%s"), szSQL);
			rs.ExecSQL(szSQL);
			long nDocumentNo = 0;
			rs.GetValue(_T("docno"), nDocumentNo);
			if(nDocumentNo > 0){	

				m_nDocumentNo = nDocumentNo;
				GetDataToScreen();
				return 0;
			}
			else
			{
				SetMode(VM_ADDPAT);
				
				m_szPatientName = szPatientName;
				m_szSexKey = szSex;
				m_szAge = szAge; 
				m_szCMND = szIDNo;
				m_szBirthDate = szBirthDate;
				m_szProvillKey = szProvillKey; 
				m_szDistrictKey = szDistrictKey;
				m_szVillageKey = szVillageKey;

				//m_szOccupationKey = _T("6");				

				// Gọi hàm GetCardInfor để lấy thông tin thẻ BH
				CString szPatientName1, szSex1, szBirthDate1, szCardNo1;
				if(GetCardInfor(szIDNo, szPatientName, szSex, szBirthDate, szCardNo1, szPatientName1, szSex1, szBirthDate1))
				{
					m_szObjectKey = _T("4");
					m_sCardInfo.szSex = szSex;
					m_szSexKey = szSex;
					m_szCardNoFind = szCardNo1;					

					CDate dte;
					dte.ParseDate(szBirthDate1, yyyymmdd);
					szBirthDate.Format(_T("%.2d/%.2d/%.4d"), dte.GetDay(), dte.GetMonth(), dte.GetYear());

					m_szBirthDate = szBirthDate;
				}
				else 
				{
					
					if(szIDNo.IsEmpty())
					{
						m_szCardNo.Empty();
						m_szObjectKey = _T("7");
						m_szCardNoFind.Empty();

						m_wndExamType.SetFocus();
					}
					else
					{
						CRMCanCuocCDDlg dlg(this);
						dlg.m_szCCCD = szIDNo.Trim();
						dlg.m_pWndOrder = this;
						if(dlg.DoModal()==IDOK)
						{			
							
						}
					}					
				}
				//_msg(_T("%s, %s, %s, %s"), m_szCardNoFind, szPatientName, szBirthDate1, szSex);
			}
			
		}
		else if(arInfo.GetCount() >= 11 && arInfo.GetCount() <= 15) // The cu
		{
			m_sCardInfo.xCardno = arInfo[0];
			szPatientName = arInfo[1];

			CDate dte;
			if(arInfo[2].GetLength() >= 10)
			{
				if(dte.ParseDate(arInfo[2], ddmmyyyy))
				{		
					szBirthDate.Format(_T("%.2d/%.2d/%.4d"), dte.GetDay(), dte.GetMonth(), dte.GetYear());
				}
				else
				{
					dte.ParseDate(arInfo[2], yyyymmdd);
					szBirthDate.Format(_T("%.2d/%.2d/%.4d"), dte.GetDay(), dte.GetMonth(), dte.GetYear());
				}
			}
			else if(arInfo[2].GetLength() == 4)
			{
				szBirthDate = arInfo[2];
			} 
			else if(!dte.ParseDate(szBirthDate, ddmmyyyy))
			{
				szBirthDate = _T("1980");
			}

			m_szBirthDate = szBirthDate;
			m_sCardInfo.szBirthDate= szBirthDate;

			//_msg(_T("\r\nszBirthDate: %s"),szBirthDate);
			//szBirthDate.Replace(_T("/"), _T(""));
			szSex = arInfo[3] == _T("1")?_T("M"):_T("F");
			m_sCardInfo.szSex= szSex;
			
			m_sCardInfo.company = arInfo[4];
			m_sCardInfo.regplacecde = arInfo[5];

			m_sCardInfo.regdate = CDate::Convert(arInfo[6], ddmmyyyy, yyyymmdd);
			m_sCardInfo.expdate = CDate::Convert(arInfo[7], ddmmyyyy, yyyymmdd);
			m_sCardInfo.sz5YearDate = CDate::Convert(arInfo[12], ddmmyyyy, yyyymmdd);
			if(m_sCardInfo.xCardno.GetLength() > 15)
			{
				m_sCardInfo.xCardno = m_sCardInfo.xCardno.Left(15);
			}

			if(CompareDate(m_sCardInfo.expdate, pMF->GetSysDate()) < 0 && !m_sCardInfo.expdate.IsEmpty())
			{	
				CString szMsg;
				szMsg.Format(_T("Th\x1EBB \x42H \x111\xE3 h\x1EBFt h\x1EA1n [%s]. \x43\xF3 \x63ho \x62\x1EC7nh nh\xE2n ti\x1EBFp t\x1EE5\x63 kh\xE1m?"), m_sCardInfo.expdate);
				if(ShowMessageBox(szMsg, MB_ICONERROR|MB_YESNO) == IDNO)
				{
					m_szCardNoFind.Empty();
					UpdateData(false);				
					return -1;
				}
			}

			szCardInfo.Format(_T("%s%s"), m_sCardInfo.xCardno, m_sCardInfo.regplacecde);
			m_szCardNoFind = szCardInfo;	
		}
		else if(arInfo.GetCount() > 15 && arInfo.GetCount() <= 17) //1666/QĐ-BHXH ngày 03/12/2020
		{			
			_tprintf(_T("\r\nThe 10 so moi: %d"), arInfo.GetCount());
			m_sCardInfo.xCardno = arInfo[0];
			szPatientName = arInfo[1];
			
			CDate dte;
			if(arInfo[2].GetLength() >= 10)
			{
				if(dte.ParseDate(arInfo[2], ddmmyyyy))
				{		
					szBirthDate.Format(_T("%.2d/%.2d/%.4d"), dte.GetDay(), dte.GetMonth(), dte.GetYear());
				}
				else
				{
					dte.ParseDate(arInfo[2], yyyymmdd);
					szBirthDate.Format(_T("%.2d/%.2d/%.4d"), dte.GetDay(), dte.GetMonth(), dte.GetYear());
				}
			}
			else if(arInfo[2].GetLength() == 4)
			{
				szBirthDate = arInfo[2];
			} 
			else if(!dte.ParseDate(szBirthDate, ddmmyyyy))
			{
				szBirthDate = _T("1980");
			}

			m_szBirthDate = szBirthDate;
			m_sCardInfo.szBirthDate= szBirthDate;

			//_msg(_T("\r\nszBirthDate: %s"),szBirthDate);
			//szBirthDate.Replace(_T("/"), _T(""));
			szSex = arInfo[3] == _T("1")?_T("M"):_T("F");
			m_sCardInfo.szSex= szSex;
			
			m_sCardInfo.company = arInfo[4];
			m_sCardInfo.regplacecde = arInfo[5];

			m_sCardInfo.regdate = CDate::Convert(arInfo[6], ddmmyyyy, yyyymmdd);
			m_sCardInfo.expdate = CDate::Convert(arInfo[7], ddmmyyyy, yyyymmdd);
			m_sCardInfo.sz5YearDate = CDate::Convert(arInfo[12], ddmmyyyy, yyyymmdd);
			
			int nMuchuong = 0;
			nMuchuong = str2int(arInfo[14]);
			m_sCardInfo.code = arInfo[14];			
			if(nMuchuong > 0){
				switch (nMuchuong)
				{
					case 3:
						m_sCardInfo.discount = 95;
						break;
					case 4:
						m_sCardInfo.discount = 80;
						break;
					default:
						m_sCardInfo.discount = 100;
						break;
				}
			}

			if(CompareDate(m_sCardInfo.expdate, pMF->GetSysDate()) < 0 && !m_sCardInfo.expdate.IsEmpty())
			{	
				CString szMsg;
				szMsg.Format(_T("Th\x1EBB \x42H \x111\xE3 h\x1EBFt h\x1EA1n [%s]. \x43\xF3 \x63ho \x62\x1EC7nh nh\xE2n ti\x1EBFp t\x1EE5\x63 kh\xE1m?"), m_sCardInfo.expdate);
				if(ShowMessageBox(szMsg, MB_ICONERROR|MB_YESNO) == IDNO)
				{
					m_szCardNoFind.Empty();
					UpdateData(false);				
					return -1;
				}
			}
			
			m_szCardNoFind = m_sCardInfo.xCardno;			
		}		
	}
	else if(m_szCardNoFind.GetLength() == 12)
	{		
		// Kiểm tra nếu có thông tin bn trong db thì lấy thông tin lần khám gần nhất ra
		szSQL.Format(_T("SELECT MAX(hd_docno) as docno ") \
			_T(" FROM hms_patient ") \
			_T(" LEFT JOIN hms_doc ON (hd_patientno = hp_patientno) ") \
			_T(" WHERE hp_sin = '%s' and hp_sin <> ''"), m_szCardNoFind.Trim());
		_tprintf(_T("\r\n%s"), szSQL);
		rs.ExecSQL(szSQL);
		long nDocumentNo = 0;
		rs.GetValue(_T("docno"), nDocumentNo);
		if(nDocumentNo > 0){	

			m_nDocumentNo = nDocumentNo;
			GetDataToScreen();
			return 0;
		}
		else
		{
			CRMCanCuocCDDlg dlg(this);
			dlg.m_szCCCD = m_szCardNoFind;
			dlg.m_pWndOrder = this;
			if(dlg.DoModal()==IDOK)
			{			
				
			}
		}
	}
	
	m_szCardNoFind.Trim();
	m_szCardNoFind = m_szCardNoFind.MakeUpper();	
	//_tprintf(_T("\r\nCardNo:%s, Code:%s, Discount:%d, GroupID:%d"), m_szCardNoFind, m_sCardInfo.code, m_sCardInfo.discount, nGroupID);
	if(m_szCardNoFind.GetLength() >= 10)
	{

		if(pMF->ParseCard(_T(""), m_szCardNoFind, szCode, nDiscount, nGroupID) < 0)
		{
			m_wndCardNoFind.SetToolTipMessage(_T("Invalid Card Number"));
			return -1;
		}

		szSQL.Format(_T("SELECT hc_idx FROM hms_card WHERE (upper(hc_cardno)=upper('%s') OR upper(substring(hc_cardno,6, 10))=upper('%s')) and hc_active='Y' "), m_szCardNoFind, m_szCardNoFind);
		rs.ExecSQL(szSQL);
		if (rs.GetRecordCount() >= 1)
		{
			long nIndex;
			rs.GetValue(_T("hc_idx"), nIndex);		

			szSQL.Format(_T("SELECT max(hd_docno) as docno FROM hms_doc WHERE upper(hd_cardno)=upper('%s') OR upper(substring(hd_cardno,6, 10))=upper('%s')"), m_szCardNoFind, m_szCardNoFind);
			rss.ExecSQL(szSQL);
			if (!rss.IsEOF())
			{
				rss.GetValue(_T("docno"), m_nDocumentNo);
				if(m_nDocumentNo <= 0)
				{
					szSQL.Format(_T("DELETE FROM hms_card WHERE upper(hc_cardno)=upper('%s') "), m_szCardNoFind);			
					pMF->ExecSQL(szSQL);
				}

				GetDataToScreen();
			}

		}
		else
		{
			m_nPatientNo = m_nDocumentNo = 0;
			pMF->m_nDocumentNo = 0;
			pMF->m_nPatientNo = 0;
			UpdateData(false);
		
			CHMSCardEntryDialog dlg(this, VM_ADD, true);
			dlg.m_nPatientNo = -1;
			dlg.m_szCardNo = m_szCardNoFind;
			dlg.m_nIndex = m_nCardIdx;		
			dlg.m_szObjectType = szCode;
			dlg.m_szCompany = m_sCardInfo.company;
			dlg.m_szPatientName = szPatientName;
			dlg.m_szRegistrationDate = m_sCardInfo.regdate;
			dlg.m_szExpiryDate = m_sCardInfo.expdate;
			dlg.m_szRegistrationPlaceKey = m_sCardInfo.regplacecde;	
			dlg.m_nDiscount = m_sCardInfo.discount;		
			dlg.m_nGroupID = m_sCardInfo.groupid;
			dlg.m_szCode = m_sCardInfo.code;
			dlg.m_szDoituongkcbKey = m_szDoituongkcb;
			
				//pMF->m_szCardRegCode = m_sCardInfo.regplacecde;

				//_msg(_T("%s, %s, %s, %s"), m_szCardNoFind, szPatientName, szSex, m_szBirthDate);
			if(m_szBirthDate.GetLength() <= 4){
				m_bYearofBirth = true;
				m_szBirthDate.Format(_T("01/01/%s"), m_szBirthDate);
			}
			
			dlg.m_szBirthDate =CDate::Convert(m_szBirthDate,ddmmyyyy,yyyymmdd);
			dlg.m_szSexKey= m_sCardInfo.szSex;
			dlg.m_szFromDate= CDate::Convert(m_sCardInfo.sz5YearDate,ddmmyyyy,yyyymmdd);
			dlg.m_bYearofBirth = m_bYearofBirth;		

			if(dlg.DoModal() == IDOK)
			{
				OnAddNewSelect();
				UpdateData(true);
			
				if(!szPatientName.IsEmpty())
				{
					m_szPatientName = szPatientName;
					m_szBirthDate = dlg.m_szBirthDate;					
					CString tmpStr;
					tmpStr  = szBirthDate;
					tmpStr.Replace(_T("/"), _T(""));
					m_szAge = tmpStr;
					m_szSexKey = szSex;
	//_msg(_T("\r\nszPatientName: %s, %s, %s"), szPatientName, dlg.m_szBirthDate, szBirthDate);
				}
				else
				{
					m_szPatientName = dlg.m_szPatientName;
					m_szBirthDate = dlg.m_szBirthDate;
					m_szAge.Format(_T("%s%s"), m_szBirthDate.Mid(5, 2), m_szBirthDate.Left(4));
					m_szSexKey = dlg.m_szSexKey;
				}

				m_sCardInfo.regdate = dlg.m_szRegistrationDate;
				m_sCardInfo.expdate = dlg.m_szExpiryDate;
				_tprintf(_T("\r\nregdate: %s| expdate: %s"), m_sCardInfo.regdate, m_sCardInfo.expdate);
				
				m_szDoituongkcb = dlg.m_szDoituongkcbKey;
				m_sCardInfo.regplacecde = dlg.m_szRegistrationPlaceKey;
				m_sCardInfo.discount = dlg.m_nDiscount;
				m_sCardInfo.groupid = dlg.m_nGroupID;
				m_sCardInfo.code = dlg.m_szCode;
				m_szCardNo = dlg.m_szCardNo;
				m_szCurCardNo = m_szCardNo;
				m_sCardInfo.company = dlg.m_szCompany;
				if(!dlg.m_szCompany.IsEmpty())
					m_szWorkingPlace = dlg.m_szCompany;

				szSQL.Format(_T("SELECT hms_getage(current_date,'%s') as tuoi"), m_szAge);
				rs.ExecSQL(szSQL);
				if(!rs.IsEOF()){
					CString szAge;
					rs.GetValue(_T("tuoi"), szAge);
					if(szAge.Right(2) == _T("Th") || szAge.Right(2) == _T("Ng") || ToInt(szAge) <= 6){
						m_szWorkingPlace.Empty();
					}
				}			


				m_nDisrate = dlg.m_nDisrate;
				m_szOffLine = dlg.m_bOffLine?_T("Y"):_T("N");

	//_msg(_T("%d"), m_nDisrate);

				m_szObjectKey = dlg.m_szObjectKey;
				if(m_szOffLine == _T("Y"))
					m_wndCardNo.SetTextColor(RGB(255, 0, 0));
				else
					m_wndCardNo.SetTextColor(RGB(0, 0, 255));				
				
				m_sCardInfo.xobject = dlg.m_szxObject;
				m_sCardInfo.xCardno = dlg.m_szxCardNo;
				m_sCardInfo.xIssueDate = dlg.m_szxIssueDate;
				m_sCardInfo.xIssuePlace = dlg.m_szxIssuePlace;
				m_sCardInfo.szArea = dlg.m_szAreaKey;
				m_bOver5years = dlg.m_b5Years;
				m_bHasFeePaper= dlg.m_bHasDisCount;
				m_szDateDiscountAll = dlg.m_szDateDisCount;
				m_szDateOver5year=dlg.m_szFromDate ;
				m_bSameInsLevel = dlg.m_bSameInsLevel;
				m_szEmergency = dlg.m_bEmergency?_T("Y"):_T("N");
				m_bYearofBirth = dlg.m_bYearofBirth;

				if (!dlg.m_szAddress.IsEmpty())
				{
					CString szSQL;
					szSQL.Format(_T("decode_address2('%s')"), dlg.m_szAddress);
					CString szCodeAddr = pMF->ExecDML(szSQL);
					_tprintf(_T("\r\nszCodeAddr: %s"), szCodeAddr);
					CStringToken tkAddr(szCodeAddr, _T("."));
					tkAddr.GetAt(0, m_szProvillKey);
					tkAddr.GetAt(1, m_szDistrictKey);
					tkAddr.GetAt(2, m_szVillageKey);
				}

				
				if(pMF->m_szObjectInsurance != _T("Y"))
				{
					m_szObjectKey =_T("9");
					m_nDisrate = 0;			
					m_szCardNo.Empty();					
				}

				UpdateData(false);
				m_wndPatientName.SetFocus();
				m_wndCardNoButton.EnableWindow(false);
				m_bAllowAddCard = false;
				m_wndObject.EnableWindow(FALSE);
			}
		}
	}	
	return 0;
} 
/*int CHMSRegistration::OnPatientNameChange(){
	return 0;
} */
/*int CHMSRegistration::OnPatientNameSetfocus(){
	return 0;
} */
/*int CHMSRegistration::OnPatientNameKillfocus(){
	return 0;
} */
int CHMSRegistration::OnPatientNameCheckValue(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	
	
	return 0;
} 
/*int CHMSRegistration::OnAgeChange(){
	return 0;
} */
/*int CHMSRegistration::OnAgeSetfocus(){
	return 0;
} */
/*int CHMSRegistration::OnAgeKillfocus(){
	return 0;
} */
int CHMSRegistration::OnAgeCheckValue(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	CString tmpStr, szSQL, tmpStr2, szCurrDate;
	int age;
	UpdateData(true);
	CRecord rs(&pMF->m_db);
	CDate dte;
	szCurrDate = pMF->GetSysDate();
	

	if(	m_szAge.GetLength() == 8 && m_bYearofBirth == true && m_szAge.Find(_T(" "),0) == -1)
	{	
		m_szBirthDate.Format(_T("%s/%s/%s"), m_szAge.Right(4), m_szAge.Mid(2, 2), m_szAge.Left(2));
		m_bYearofBirth=true;
	}
	else if(m_szAge.GetLength() == 8 && IsDigit(m_szAge)){
		m_szBirthDate.Format(_T("%s/%s/%s"), m_szAge.Right(4), m_szAge.Mid(2, 2), m_szAge.Left(2));
		m_bYearofBirth = false;
	}
	else if(m_szAge.GetLength() == 4 && IsDigit(m_szAge)){
		dte.ParseDate(szCurrDate);
		//m_szBirthDate.Format(_T("%s/%.2d/01"), m_szAge.Right(4), dte.GetMonth());
		m_szBirthDate.Format(_T("%s/01/01"), m_szAge.Right(4));
		m_bYearofBirth = true;
	}
	else if(m_szAge.GetLength() <=2 && IsDigit(m_szAge)){
		dte.ParseDate(szCurrDate);
		if(ToInt(m_szAge) <= 3)
		m_szBirthDate.Format(_T("%.4d/%.2d/01"), dte.GetYear()-ToInt(m_szAge), dte.GetMonth());
		else
			m_szBirthDate.Format(_T("%.4d/01/01"), dte.GetYear()-ToInt(m_szAge));
	}
	else if(m_szAge.GetLength() <= 3 && IsDigit(m_szAge.Left(m_szAge.GetLength()-1))){
		dte.ParseDate(szCurrDate);
		if(m_szAge.Right(1) == _T("t"))
		{
			int nMonth = ToInt(m_szAge.Left(m_szAge.GetLength()-1));
			for (int i = 0; i < nMonth; i++){
				dte -= dte.GetMonthLastDay();
			}
			m_szBirthDate.Format(_T("%.4d/%.2d/01"), dte.GetYear(), dte.GetMonth());
		}
		else if(m_szAge.Right(1) == _T("n"))
		{
			dte -= ToInt(m_szAge.Left(m_szAge.GetLength()-1));
			m_szBirthDate.Format(_T("%.4d/%.2d/%.2d"), dte.GetYear(), dte.GetMonth(), dte.GetDay());
		}
		else if(ToInt(m_szAge) <= 130)
		{			
			m_szBirthDate.Format(_T("%.4d/%.2d/01"), dte.GetYear()-ToInt(m_szAge), dte.GetMonth());
		}
		else
			return -1;
	}
	

	if(!CDate::IsValid(m_szBirthDate))
		return -1;

	if(CompareDate(m_szBirthDate, m_szExamDate) > 0)
		return -1;

	CString szDay, szMonth, szYear, short_day, short_month;
	if(GetLocalLang() == 0)
	{
		szDay = _T("Day");
		szMonth = _T("Month");
		szYear = _T("Age");
		short_day = _T("d");
		short_month = _T("m");
	}
	else
	{
		TranslateString(_T("Day"), szDay);
		TranslateString(_T("Month"), szMonth);
		TranslateString(_T("Age"), szYear);
		short_day = _T("n");
		short_month = _T("t");
	}

	szSQL.Format(_T("SELECT hms_getage(date('%s'), '%s') "), m_szExamDate,  m_szBirthDate);
	rs.ExecSQL(szSQL);	
	m_szAge.Format(_T("%s"), rs.GetStringValue());
	if(m_szAge.Right(1) == _T("T"))
	{
		//m_szOccupationKey = _T("9");
		m_szAge.Replace(_T("T"), szMonth);
	}
	if(m_szAge.Right(1) == _T("N"))
	{
		//m_szOccupationKey = _T("9");
		m_szAge.Replace(_T("N"), szDay);
	}
	if(IsDigit(m_szAge)){

		m_szAge.AppendFormat(_T(" %s"), szYear);
		/*if(ToInt(m_szAge.Left(3)) < 6)
			m_szOccupationKey = _T("9");
		else if(ToInt(m_szAge.Left(3)) < 15)
			m_szOccupationKey = _T("5");*/

		if(ToInt(m_szAge.Left(3)) >= 65 && ToInt(m_szAge.Left(3)) < 75)
		{
				/*if(m_wndOccupation.GetCurrent(1).IsEmpty())
					m_szOccupationKey = _T("8");*/
		}
		else if(ToInt(m_szAge.Left(3)) > 75){
			/*if(m_wndOccupation.GetCurrent(1).IsEmpty())
				m_szOccupationKey = _T("11");*/
		}
	}	
	
	_tprintf(_T("\r\n%s, %s, %d, %d, %d"), m_szExamDate, m_szBirthDate, ToInt(m_szAge), CompareDate(m_szBirthDate, m_szExamDate));
	UpdateData(false);
	
	return 0;

} 
/*int CHMSRegistration::OnBirthDateChange(){
	return 0;
} */
/*int CHMSRegistration::OnBirthDateSetfocus(){
	return 0;
} */
/*int CHMSRegistration::OnBirthDateKillfocus(){
	return 0;
} */
int CHMSRegistration::OnBirthDateCheckValue(){
	return 0;
} 
int CHMSRegistration::OnSexSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 
int CHMSRegistration::OnSexSelendok(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	
	 return 0;
}
/*int CHMSRegistration::OnSexSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnSexKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnSexLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL, szWhere;
	if(m_wndSex.IsSearchKey() && !m_szSexKey.IsEmpty()){
		szWhere.Format(_T(" AND ss_code='%s' "), m_szSexKey);
	};
	szSQL.Format(_T("SELECT ss_code as id, ss_desc as name FROM sys_sel WHERE ss_id='sys_sex' %s ORDER BY ss_code "), szWhere);
	m_wndSex.DeleteAllItems(); 
	int nCount = 0;
	nCount = rs.ExecSQL(szSQL);
	while(!rs.IsEOF()){ 
		m_wndSex.AddItems(
			rs.GetValue(_T("id")), 
			rs.GetValue(_T("name")), NULL);
		rs.MoveNext();
	}
	return nCount;
}
/*int CHMSRegistration::OnSexAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */
int CHMSRegistration::OnEthnicSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 
int CHMSRegistration::OnEthnicSelendok(){
	 return 0;
}
/*int CHMSRegistration::OnEthnicSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnEthnicKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnEthnicLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL, szWhere;
	if(m_wndEthnic.IsSearchKey() && !m_szEthnicKey.IsEmpty()){
		szWhere.Format(_T(" AND ss_code='%s' "), m_szEthnicKey);
	};

	if(GetMode() != VM_VIEW && GetMode() != VM_EDIT)
	{
		szWhere.AppendFormat(_T(" and ss_active = 'Y' "));
	}

	szSQL.Format(_T("SELECT ss_code as id, ss_desc as name FROM sys_sel WHERE ss_id='sys_ethnic' %s ORDER BY cast(ss_code as integer) "),szWhere);
	m_wndEthnic.DeleteAllItems(); 
	int nCount = 0;
	nCount = rs.ExecSQL(szSQL);
	while(!rs.IsEOF()){ 
		m_wndEthnic.AddItems(
			rs.GetValue(_T("id")), 
			rs.GetValue(_T("name")), NULL);
		rs.MoveNext();
	}
	return nCount;
}
/*int CHMSRegistration::OnEthnicAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */
int CHMSRegistration::OnOccupationSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 
int CHMSRegistration::OnOccupationSelendok(){
	 return 0;
}
/*int CHMSRegistration::OnOccupationSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnOccupationKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnOccupationLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL, szWhere;
	if(m_wndOccupation.IsSearchKey() && !m_szOccupationKey.IsEmpty()){
		szWhere.Format(_T(" AND ss_code='%s' "), m_szOccupationKey);
	};

	if(GetMode() != VM_VIEW && GetMode() != VM_EDIT)
	{
		szWhere.AppendFormat(_T(" and ss_active = 'Y' "));
	}

	szSQL.Format(_T("SELECT ss_code as id, ss_desc as name FROM sys_sel WHERE ss_id='sys_occupation' %s ORDER BY cast(ss_code as integer) "),szWhere);
	//_msg(_T("%s"), szSQL);
	m_wndOccupation.DeleteAllItems(); 
	int nCount = 0;
	nCount = rs.ExecSQL(szSQL);
	while(!rs.IsEOF()){ 
		m_wndOccupation.AddItems(
			rs.GetValue(_T("id")), 
			rs.GetValue(_T("name")), NULL);
		rs.MoveNext();
	}
	return nCount;
}
/*int CHMSRegistration::OnOccupationAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */

int CHMSRegistration::OnProvillSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	return 0;
} 
int CHMSRegistration::OnProvillSelendok(){

	UpdateData(true);	
	if(m_szProvillKey != m_szDistrictKey.Left(3))
	{
		m_szDistrictKey.Empty();
		m_szVillageKey.Empty();
		m_wndDistrict.ResetContent();
		m_wndVillage.ResetContent();
	}
	
	
	return 0;
}
/*int CHMSRegistration::OnProvillSetfocus(){
	 return 0;
}*/
int CHMSRegistration::OnProvillKillfocus(){
	

	return 0;
}

int CHMSRegistration::OnProvillLoadData(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	//load provill from hmscore
	m_wndProvill.SetSearchEx(true, 2);

	CString szFilter;
	if( GetMode() != VM_VIEW )
	{
		szFilter.Format(_T(" and sp_active = 'Y' "));
	}
	//_msg(_T("%d, %s"), GetMode(), szFilter);
	return pMF->LoadProvillList(&m_wndProvill, m_szProvillKey, szFilter);

}
/*int CHMSRegistration::OnProvillAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */


int CHMSRegistration::OnDistrictSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	
	 return 0;
} 
int CHMSRegistration::OnDistrictSelendok(){

	if(m_szDistrictKey != m_szVillageKey.Left(5))
	{
		m_szVillageKey.Empty();
		m_wndVillage.ResetContent();
	}
	return 0;
}
/*int CHMSRegistration::OnDistrictSetfocus(){
	 return 0;
}*/

int CHMSRegistration::OnDistrictKillfocus(){
	
	return 0;
}
int CHMSRegistration::OnDistrictLoadData(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	//load district from hmscore
	m_wndDistrict.SetSearchEx(true, 2);

	CString szFilter;
	if( GetMode() != VM_VIEW )
	{
		szFilter.Format(_T(" and sd_active = 'Y' "));
	}

	return pMF->LoadDistrictList(&m_wndDistrict, m_szProvillKey, m_szDistrictKey, szFilter);

}
/*int CHMSRegistration::OnDistrictAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */

int CHMSRegistration::OnVillageSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	
	 return 0;
} 
int CHMSRegistration::OnVillageSelendok(){
	return 0;
}
/*int CHMSRegistration::OnVillageSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnVillageKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnVillageLoadData(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	//load village from hmscore
	m_wndVillage.SetSearchEx(true, 2);

	CString szFilter;
	if(GetMode() != VM_EDIT && GetMode() != VM_VIEW )
	{
		szFilter.Format(_T(" and sv_active = 'Y' "));
	}
	return pMF->LoadVillageList(&m_wndVillage, m_szProvillKey, m_szDistrictKey, m_szVillageKey, szFilter);
}
/*int CHMSRegistration::OnVillageAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */

int CHMSRegistration::OnAddressSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	
	 return 0;
} 
int CHMSRegistration::OnAddressSelendok(){
	return 0;
}
/*int CHMSRegistration::OnAddressSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnAddressKillfocus(){
	 return 0;
}*/

/*int CHMSRegistration::OnAddressSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnAddressKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnAddressLoadData(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	
	return pMF->LoadAddressList(&m_wndAddress, m_szAddressKey);


	m_wndAddress.DeleteAllItems(); 
//	m_wndAddress.SetSearcToHext(TRUE);
	int nCount = 0;
	if(m_wndAddress.IsSearchKey() && !m_szAddressKey.IsEmpty()){
		CString szSQL;
		szSQL.Format(_T("select sv_id as id, sv_name||' - '||sd_name||' - '||sp_name as name, \
					sv_wrd||sd_wrd||sp_wrd as srch \
					from sys_prov left join sys_dist on(sd_provid=sp_id) \
					left join sys_vill on(sv_provid=sd_provid and sv_distid=sd_id) \
					where sv_id=%ld \
					order by sp_name, sd_name, sv_name "), ToLong(m_szAddressKey));
	//	_msg(_T("%s: %s"), szSQL, m_szAddressKey);
		CRecord rs(&pMF->m_db);
		nCount = rs.ExecSQL(szSQL);
		if(nCount > 0)
		{
			m_wndAddress.AddItems(
				rs.GetValue(_T("srch")), 
				rs.GetValue(_T("name")), 
				rs.GetValue(_T("id")), 
				NULL);
		}
		return nCount;
	}
	if(m_wndAddress.GetCount() > 0){
		return 0;
	}
	m_rsAddress->MoveFirst();
	while(!m_rsAddress->IsEOF()){ 
		m_wndAddress.AddItems(
			m_rsAddress->GetValue(_T("srch")), 
			m_rsAddress->GetValue(_T("name")), 
			m_rsAddress->GetValue(_T("id")), 
			NULL);
		m_rsAddress->MoveNext();
	}
	return nCount;

}
/*int CHMSRegistration::OnAddressAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */
/*int CHMSRegistration::OnDetailAddressChange(){
	return 0;
} */
/*int CHMSRegistration::OnDetailAddressSetfocus(){
	return 0;
} */
/*int CHMSRegistration::OnDetailAddressKillfocus(){
	return 0;
} */
int CHMSRegistration::OnDetailAddressCheckValue(){
	return 0;
} 
/*int CHMSRegistration::OnWorkingPlaceChange(){
	return 0;
} */
/*int CHMSRegistration::OnWorkingPlaceSetfocus(){
	return 0;
} */
/*int CHMSRegistration::OnWorkingPlaceKillfocus(){
	return 0;
} */
int CHMSRegistration::OnWorkingPlaceCheckValue(){
	return 0;
} 
int CHMSRegistration::OnIntroductionSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 
int CHMSRegistration::OnIntroductionSelendok(){
	 return 0;
}
/*int CHMSRegistration::OnIntroductionSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnIntroductionKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnIntroductionLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL, szWhere;
	if(m_wndIntroduction.IsSearchKey() && !m_szIntroductionKey.IsEmpty()){
		szWhere.Format(_T(" WHERE hmsi_id= %d "), ToInt(m_szIntroductionKey));
	};
	m_wndIntroduction.DeleteAllItems(); 
	int nCount = 0;

	szSQL.Format(_T("SELECT hmsi_id as id, hmsi_name as name, hmsi_desc as desc FROM hms_introduction %s ORDER BY hmsi_id, hmsi_name "), szWhere);
	_fmsg(_T("%s"), szSQL);
	nCount = rs.ExecSQL(szSQL);
	while(!rs.IsEOF()){ 
		m_wndIntroduction.AddItems(
			rs.GetValue(_T("id")), 
			rs.GetValue(_T("name")),
			rs.GetValue(_T("desc")), NULL);
		rs.MoveNext();
	}
	return nCount;
	return 0;
}
/*int CHMSRegistration::OnIntroductionAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */
int CHMSRegistration::OnPositionSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 
int CHMSRegistration::OnPositionSelendok(){
	 return 0;
}
/*int CHMSRegistration::OnPositionSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnPositionKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnPositionLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL, szWhere;
#ifdef HOSPITAL_NORMAL
	if(m_wndPosition.IsSearchKey() && !m_szIntroductionKey.IsEmpty()){
		szWhere.Format(_T(" AND ss_code='%s'"), m_szIntroductionKey);
	};
	m_wndPosition.DeleteAllItems(); 
	int nCount = 0;
	szSQL.Format(_T("SELECT ss_code as id, ss_desc as name FROM sys_sel WHERE ss_id='hrm_relation' %s ORDER BY cast(ss_code as integer) "), szWhere);
	nCount = rs.ExecSQL(szSQL);
	while(!rs.IsEOF()){ 
		m_wndPosition.AddItems(
			rs.GetValue(_T("id")), 
			rs.GetValue(_T("name")), NULL);
		rs.MoveNext();
	}
#else
	if(m_wndPosition.IsSearchKey() && !m_szPositionKey.IsEmpty()){
		szWhere.Format(_T(" AND ss_code='%s'"), m_szPositionKey);
	};
	m_wndPosition.DeleteAllItems(); 
	int nCount = 0;
	szSQL.Format(_T("SELECT ss_code as id, ss_desc as name FROM sys_sel WHERE ss_id='hms_position' %s ORDER BY cast(ss_code as integer) "), szWhere);
	nCount = rs.ExecSQL(szSQL);
	while(!rs.IsEOF()){ 
		m_wndPosition.AddItems(
			rs.GetValue(_T("id")), 
			rs.GetValue(_T("name")), NULL);
		rs.MoveNext();
	}
#endif
	return nCount;

}
/*int CHMSRegistration::OnPositionAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */

/*int CHMSRegistration::OnPhoneChange(){
	return 0;
} */
/*int CHMSRegistration::OnPhoneSetfocus(){
	return 0;
} */
/*int CHMSRegistration::OnPhoneKillfocus(){
	return 0;
} */
int CHMSRegistration::OnPhoneCheckValue(){
	return 0;
} 
int CHMSRegistration::OnObjectSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 
int CHMSRegistration::OnObjectSelendok(){
//	if(GetMode() != VM_ADD && GetMode() != VM_EDIT)
//		return 0;
	if(!m_bAllowAddCard)
		return 0;
	//UpdateData(true);
	CString szCardFormat, szHasCard;
	m_szObjectKey = m_wndObject.GetCurrent(0);
	szHasCard = m_wndObject.GetCurrent(2);
	if(szHasCard == _T("Y"))
		m_wndCardNoButton.EnableWindow(true);
	else
		m_wndCardNoButton.EnableWindow(false);

	if(GetMode() == VM_EDIT)
	{
		if(szHasCard != _T("Y"))
			m_szCardNo.Empty();	
	}	

	//UpdateData(false);
	return 0;
}
/*int CHMSRegistration::OnObjectSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnObjectKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnObjectLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL, szWhere;
	szWhere.Empty();
	if(m_wndObject.IsSearchKey() && !m_szObjectKey.IsEmpty()){
		szWhere.Format(_T(" AND ho_id='%s' "), m_szObjectKey);
	};
	if(!pMF->m_UserInfo.su_hms_xobject.IsEmpty())
		szWhere.AppendFormat(_T(" AND ho_id in(%s) "), pMF->m_UserInfo.su_hms_xobject);
	szSQL.Format(_T("SELECT * FROM hms_object WHERE ho_active='Y' %s ORDER BY ho_id "), szWhere);
	m_wndObject.DeleteAllItems(); 
	int nCount = 0;
	nCount = rs.ExecSQL(szSQL);
	while(!rs.IsEOF()){ 
		m_wndObject.AddItems(
			rs.GetValue(_T("ho_id")), 
			rs.GetValue(_T("ho_desc")), 
			rs.GetValue(_T("ho_hascard")), 
			rs.GetValue(_T("ho_type")), 
			rs.GetValue(_T("ho_discount")), 
			NULL);
		rs.MoveNext();
	}
	return nCount;
}
/*int CHMSRegistration::OnObjectAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */

int CHMSRegistration::OnPatientNameFindSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 
int CHMSRegistration::OnPatientNameFindSelendok(){
	m_nPatientNo = m_nDocumentNo = 0;
	m_nPatientNo = str2long(m_wndPatientNameFind.GetCurrent(0));
	if(m_nPatientNo > 0)
	{
		m_szPatientNameFindKey.Empty();
		GetDataToScreen();
	}

	return 0;
}
/*int CHMSRegistration::OnPatientNameFindSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnPatientNameFindKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnPatientNameFindLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();

	m_wndPatientNameFind.SetSearchEx(true, 2);
	return pMF->LoadPatientList(&m_wndPatientNameFind, m_szPatientNameFindKey);

	return 0;
}
/*int CHMSRegistration::OnPatientNameFindAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */

/*int CHMSRegistration::OnCardNoChange(){
	return 0;
} */
/*int CHMSRegistration::OnCardNoSetfocus(){
	return 0;
} */
/*int CHMSRegistration::OnCardNoKillfocus(){
	return 0;
} */

int CHMSRegistration::OnCardNoCheckValue(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	UpdateData(true);
	
	int nGroupID;
	int nRet = pMF->ParseCard(m_szObjectKey, m_szCardNo, m_sCardInfo.code, m_sCardInfo.discount, nGroupID);
	if(nRet < 0){
		m_wndCardNo.SetToolTipMessage(_T("Invalid Card Number"));
		return -1;
	}	
	
	CRecord rs(&pMF->m_db);		
	
	CString szSQL;
	szSQL.Format(_T("SELECT * FROM hms_card WHERE upper(hc_cardno)=upper('%s') AND hc_active = 'Y' "), m_szCardNo);

	rs.ExecSQL(szSQL);
	if(!rs.IsEOF()){
		long nPatientNo;
		rs.GetValue(_T("hc_patientno"), nPatientNo);

		if(nPatientNo != m_nPatientNo)
		{
			CString szMsg, tmpStr;
			TranslateString(_T("This card is using by other patient.[%ld]"), tmpStr);
			szMsg.Format(tmpStr, nPatientNo);
			m_wndCardNo.SetToolTipMessage(szMsg);
			return -1;
		}
	}

	UpdateData(false);
	return 0;
} 

int CHMSRegistration::OnCardNoButtonSelect(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL, tmpStr;
	UpdateData(true);
	CString szCardFormat, szHasCard;
	m_szObjectKey = m_wndObject.GetCurrent(0);
	szHasCard = m_wndObject.GetCurrent(2);
	
	if (szHasCard == _T("Y"))
	{
		int nMode = VM_VIEW;
		if (GetMode() == VM_EDIT)
		{
			if (m_nPatientNo > 0)
				nMode = VM_EDIT;
			else
				nMode = VM_ADD;
		}
		if(GetMode() == VM_ADDPAT || GetMode() == VM_ADDDOC)
		{
			nMode = VM_ADD;
		}

		
		CHMSCardEntryDialog dlg(this, nMode, false);
		dlg.m_szPatientName = m_szPatientName;
		dlg.m_szObject = m_wndObject.GetCurrent(3);
		dlg.m_szCardNo = m_szCardNo;

		dlg.m_szSexKey=m_szSexKey;
		CString tmpStr;
		tmpStr=m_szBirthDate;
		tmpStr.Replace(_T("/"),_T("-"));
		dlg.m_szBirthDate=CDate::Convert(tmpStr,yyyymmdd, ddmmyyyy );
		
		dlg.m_szDateDisCount=CDate::Convert(m_szDateDiscount,yyyymmdd, ddmmyyyy );		

		dlg.m_nIndex = m_nCardIdx;
		dlg.m_szExpiryDate = m_sCardInfo.expdate;
		dlg.m_szRegistrationDate = m_sCardInfo.regdate;
		dlg.m_szRegistrationPlaceKey = m_sCardInfo.regplacecde;
		dlg.m_szCode = m_sCardInfo.code;
		dlg.m_nDiscount = m_sCardInfo.discount;
		dlg.m_szCompany = m_sCardInfo.company;
		dlg.m_nGroupID = m_sCardInfo.groupid;
		dlg.m_szObjectKey = m_wndObject.GetCurrent(0);
		dlg.m_szWorkPlace = m_szWorkingPlace;
		dlg.m_szObjectType = m_wndObject.GetCurrent(3);
		dlg.m_szSexKey= m_szSexKey;
		dlg.m_szBirthDate= m_szBirthDate;
		dlg.m_szDoituongkcbKey = m_szDoituongkcb;
	
		if(m_nPatientNo > 0)
		{
			dlg.m_nPatientNo = m_nPatientNo;
			dlg.m_nIndex = m_nCardIdx;
		}
		else
		{
			dlg.m_nPatientNo = 0;
			dlg.m_nIndex = 0;
		}
		
		if(!m_szCardNo.IsEmpty())
		{
			szSQL.Format(_T("SELECT hd_insline,hd_disrate, hd_emergency, hd_over5year five_year, hd_datediscountall discount_from,") \
						_T(" hd_hasfeepaper as has_paperfree,hd_over5yeardate as date5years, hd_sameinslevel as same_level ") \
						_T(" FROM hms_doc WHERE hd_docno=%ld and hd_cardno='%s'")
						,  m_nDocumentNo, m_szCardNo  );		

			rs.ExecSQL(szSQL);
			if (!rs.IsEOF())
			{
				rs.GetValue(_T("hd_insline"), m_szOffLine);
				rs.GetValue(_T("hd_disrate"), m_nDisrate);
				rs.GetValue(_T("hd_emergency"), tmpStr);				
				dlg.m_nDisrate = m_nDisrate;
				if(tmpStr == _T("Y"))
					dlg.m_bEmergency = TRUE;
				else
					dlg.m_bEmergency = FALSE;
				dlg.m_b5Years = rs.GetValue(_T("five_year"))==_T("Y")?TRUE:FALSE;
				dlg.m_szFromDate = rs.GetValue(_T("date5years"));
				dlg.m_szDateDisCount = rs.GetValue(_T("discount_from"));
				dlg.m_bHasDisCount = rs.GetValue(_T("has_paperfree"))==_T("Y")?TRUE:FALSE;
				dlg.m_bSameInsLevel = rs.GetValue(_T("same_level"))==_T("Y")?TRUE:FALSE;
			}
		}
		
		
		if(m_szOffLine == _T("Y")){
			dlg.m_bOffLine = TRUE;
			dlg.m_nDisrate = m_nDisrate;
		}
		else
			dlg.m_bOffLine = FALSE;

		if (GetMode()==VM_ADDDOC || GetMode() == VM_ADDPAT)
		{
			dlg.m_bOffLine=FALSE;
			dlg.m_bEmergency = FALSE;
		}
		if(dlg.DoModal() == IDOK)
		{			
			m_sCardInfo.regdate = dlg.m_szRegistrationDate;
			m_sCardInfo.expdate = dlg.m_szExpiryDate;

			//_msg(_T("%s"), m_sCardInfo.expdate);

			m_sCardInfo.regplacecde = dlg.m_szRegistrationPlaceKey;
			m_sCardInfo.discount = dlg.m_nDiscount;
			m_sCardInfo.code = dlg.m_szCode;
			m_sCardInfo.groupid = dlg.m_nGroupID;			
			m_szCardNo = dlg.m_szCardNo;
			m_szCurCardNo = m_szCardNo;
			m_sCardInfo.company = dlg.m_szCompany;
			if(!dlg.m_szCompany.IsEmpty())
				m_szWorkingPlace = dlg.m_szCompany;
			m_nDisrate = dlg.m_nDisrate;
			
			CString szBirth;
			szBirth=dlg.m_szBirthDate;	
			
			CDate::IsValid(szBirth);
			szBirth = CDate::Convert(szBirth, yyyymmdd, ddmmyyyy);
			m_szAge = m_szBirthDate = szBirth;
			m_szAge.Replace(_T("/"), _T(""));

			if(!dlg.m_szSexKey.IsEmpty())
				m_szSexKey=dlg.m_szSexKey;
			
			m_nDisrate = dlg.m_nDiscount;

			m_szOffLine = dlg.m_bOffLine?_T("Y"):_T("N");			

			m_szEmergency = _T("N");
			m_bOver5years =  dlg.m_b5Years;
			m_bHasFeePaper= dlg.m_bHasDisCount;	
			m_szDateOver5year= dlg.m_szFromDate;

			m_szDoituongkcb = dlg.m_szDoituongkcbKey;
			
			if(m_bHasFeePaper){
				
				m_szDateDiscountAll= dlg.m_szDateDisCount;
			}
			else
			{
				m_szDateDiscountAll.Empty();
			}
			m_szEmergency = dlg.m_bEmergency?_T("Y"):_T("N");
			/*if (dlg.m_bEmergency)
			{
				m_nDisrate = dlg.m_nDiscount;
				m_szEmergency = _T("Y");
			}*/

			m_bSameInsLevel = dlg.m_bSameInsLevel;
			m_sCardInfo.xobject = dlg.m_szxObject;
			m_sCardInfo.xCardno = dlg.m_szxCardNo;
			m_sCardInfo.xIssueDate = dlg.m_szxIssueDate;
			m_sCardInfo.xIssuePlace = dlg.m_szxIssuePlace;
			m_sCardInfo.szArea = dlg.m_szAreaKey;

			m_wndPatientState.SetFocus();


			if(m_szOffLine == _T("Y"))
				m_wndCardNo.SetTextColor(RGB(255, 0, 0));
			else
				m_wndCardNo.SetTextColor(RGB(0, 0, 255));

			UpdateData(false);
		
			return 0;
		}
		
	}	

	
	return 0;
} 
int CHMSRegistration::OnPatientStateSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 
int CHMSRegistration::OnPatientStateSelendok(){
	 return 0;
}
/*int CHMSRegistration::OnPatientStateSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnPatientStateKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnPatientStateLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL, szWhere;
	if(m_wndPatientState.IsSearchKey() && !m_szPatientStateKey.IsEmpty()){
		szWhere.Format(_T(" AND trim(ss_code)='%s' "), m_szPatientStateKey);
	};
	szSQL.Format(_T("SELECT ss_code as id, ss_desc as name FROM sys_sel WHERE ss_id='hms_patient_state' %s ORDER BY ss_code"), szWhere);
	m_wndPatientState.DeleteAllItems(); 
	int nCount = 0;
	nCount = rs.ExecSQL(szSQL);
	while(!rs.IsEOF()){ 
		m_wndPatientState.AddItems(
			rs.GetValue(_T("id")), 
			rs.GetValue(_T("name")), NULL);
		rs.MoveNext();
	}
	return nCount;
}
/*int CHMSRegistration::OnPatientStateAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */
/*int CHMSRegistration::OnExamDateChange(){
	return 0;
} */
/*int CHMSRegistration::OnExamDateSetfocus(){
	return 0;
} */
/*int CHMSRegistration::OnExamDateKillfocus(){
	return 0;
} */
int CHMSRegistration::OnExamDateCheckValue(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	UpdateData(true);
	CString szSQL;
	szSQL.Format(_T(" select current_date - date('%s')  as ndate "), m_szExamDate);
	rs.ExecSQL(szSQL);
	if(rs.GetIntValue() > 5 || rs.GetIntValue() < 0)
		return -1;
	return 0;
} 
int CHMSRegistration::OnExamTypeSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 

#include "HMSSelectionListDialog.h"
#include ".\hmsregistration.h"

int CHMSRegistration::OnExamTypeSelendok(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();	
	CString tmpStr, szSQL;
	CRecord rs(&pMF->m_db);
	UpdateData(true);
	int nMultiroom = ToInt(m_wndExamType.GetCurrent(5));
	m_nRoomType = ToInt(m_wndExamType.GetCurrent(6));
	
	m_arrayRoom.RemoveAll();
	if(nMultiroom == 1){
		CHMSSelectionListDialog dlg(this);
		dlg.m_szSQL.Format(_T("SELECT hrl_id as id, hrl_name as name FROM hms_roomlist WHERE hrl_deptid='%s' ORDER BY hrl_id "), pMF->m_szDept);
		tmpStr.Format(_T("D0000%.3d"), ToInt(m_szExamTypeKey));
		szSQL.Format(_T("SELECT hhr_roomid FROM hms_healthroom WHERE hhr_examtype='%s' ORDER BY hhr_roomid "), tmpStr);
		rs.ExecSQL(szSQL);
		while(!rs.IsEOF())
		{
			CHMSSelectionListDialog::SELITEM si;
			rs.GetValue(_T("hhr_roomid"), si.szID);
			si.szName.Empty();
			dlg.m_arraySelection.Add(si);
			rs.MoveNext();
		}

		if(dlg.DoModal() == IDOK){
			for (int i =0; i < dlg.m_arraySelection.GetCount(); i++){
				CHMSSelectionListDialog::SELITEM si = dlg.m_arraySelection[i];
				int nRoomID = ToInt(si.szID);
				m_arrayRoom.Add(nRoomID);
				m_wndRoom.SetFocus();
			}
		}
	}

	_tprintf(_T("\r\nRoomKey: %d"), m_nRoomType);
	if(m_nRoomType > 0)
	{
		m_szRoomKey.Format(_T("%d"), m_nRoomType);
		m_wndRoom.SetCurrent(0, m_szRoomKey);
		_tprintf(_T("\r\nRoomKey: %s"), m_szRoomKey);
	}

	if(m_arrayRoom.GetCount() > 0){
		m_szRoomKey.Format(_T("%d"), m_arrayRoom[0]);
		m_wndRoom.SetCurrent(0, m_szRoomKey);
	}

	 return 0;
}
/*int CHMSRegistration::OnExamTypeSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnExamTypeKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnExamTypeLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL, szWhere;
	if(m_wndExamType.IsSearchKey() && str2int(m_szExamTypeKey) > 0){
		szWhere.Format(_T(" AND hfl_idx=%d "), str2int(m_szExamTypeKey));
	};

	if(pMF->m_szObjectInsurance == _T("Y") && pMF->m_szAddFeeObject == _T("Y"))
	{		
		pMF->m_szObject = m_szObjectKey;
		if(pMF->GetObjectType() == _T("I"))
			szWhere.AppendFormat(_T(" and hfl_object = 'I' "));
		else
			szWhere.AppendFormat(_T(" and hfl_object <> 'I' "));
	}

	szSQL.Format(_T("SELECT ") \
		_T("hfl_idx as id,  ") \
		_T("hfl_name as name, ") \
		_T("hfl_subitem as multiroom, ") \
		_T("hfl_refitemid as refitemid, ") \
		_T("hfl_index1 as index1, ") \
		_T("hfl_servprice as servprice, ") \
		_T("hfl_insprice as insprice,") \
		_T("hfl_polprice as polprice ") \
		_T("FROM hms_feelist ") \
		_T("WHERE hfl_groupid='D0000' ") \
		_T("AND hfl_active ='Y' ") \
		_T("AND hfl_typeid='E' %s ") \
		_T("ORDER BY hfl_feeid "), szWhere);

		//_msg(_T("%s, %s"), szSQL, pMF->m_szAddFeeObject);

	m_wndExamType.DeleteAllItems(); 
	int nCount = 0;
	nCount = rs.ExecSQL(szSQL);
	while(!rs.IsEOF()){ 
		m_wndExamType.AddItems(
			rs.GetValue(_T("id")), 
			rs.GetValue(_T("name")), 
			rs.GetValue(_T("servprice")), 
			rs.GetValue(_T("insprice")), 
			rs.GetValue(_T("refitemid")),
			rs.GetValue(_T("multiroom")),
			rs.GetValue(_T("index1")),
			NULL);
		rs.MoveNext();
	}
	return nCount;
}
/*int CHMSRegistration::OnExamTypeAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */
int CHMSRegistration::OnRoomSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 
int CHMSRegistration::OnRoomSelendok(){
	 return 0;
}
/*int CHMSRegistration::OnRoomSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnRoomKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnRoomLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL, szWhere;
	if(m_wndRoom.IsSearchKey() && ToInt(m_szRoomKey) > 0){
		szWhere.Format(_T(" AND hrl_id=%d "), ToInt(m_szRoomKey));
	};
	if(!pMF->m_UserInfo.su_hms_xroom.IsEmpty())
		szWhere.AppendFormat(_T(" AND hrl_id in(%s) "), pMF->m_UserInfo.su_hms_xroom);
	szSQL.Format(_T("SELECT hrl_id as id, hrl_name as name FROM hms_roomlist WHERE hrl_deptid='%s' %s ORDER BY hrl_id "), pMF->m_szDept, szWhere);

	m_wndRoom.DeleteAllItems(); 
	int nCount = 0;
	nCount = rs.ExecSQL(szSQL);
	while(!rs.IsEOF()){ 
		m_wndRoom.AddItems(
			rs.GetValue(_T("id")), 
			rs.GetValue(_T("name")), 
			_T(""),
			NULL);
		rs.MoveNext();
	}
	return nCount;
}
/*int CHMSRegistration::OnRoomAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */
/*int CHMSRegistration::OnHospitalChange(){
	return 0;
} */
/*int CHMSRegistration::OnHospitalSetfocus(){
	return 0;
} */
/*int CHMSRegistration::OnHospitalKillfocus(){
	return 0;
} */
//int CHMSRegistration::OnHospitalCheckValue(){
//	return 0;
//} 

void CHMSRegistration::OnDiseaseBtnSelect(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	
} 

void CHMSRegistration::LoadData(long nDocNo)
{
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL;
	m_nDocumentNo = nDocNo;
	szSQL.Format(_T("SELECT max(he_receptidx) FROM hms_exam WHERE he_docno = %ld"), nDocNo);
	rs.ExecSQL(szSQL);
	m_nReceptIdx = rs.GetIntValue();
	GetDataToScreen();
	pMF->SetActivePane(0);
}

int CHMSRegistration::OnHospitalSelectChange(int nOldItemSel, int nNewItemSel){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} 
int CHMSRegistration::OnHospitalSelendok(){
	 return 0;
}
/*int CHMSRegistration::OnHospitalSetfocus(){
	 return 0;
}*/
/*int CHMSRegistration::OnHospitalKillfocus(){
	 return 0;
}*/
int CHMSRegistration::OnHospitalLoadData(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	return pMF->LoadHospitalList(&m_wndHospital, m_szHospital);
}
/*int CHMSRegistration::OnHospitalAddNew(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	 return 0;
} */

/*int CHMSRegistration::OnDiseaseChange(){
	return 0;
} */
/*int CHMSRegistration::OnDiseaseSetfocus(){
	return 0;
} */
/*int CHMSRegistration::OnDiseaseKillfocus(){
	return 0;
} */
int CHMSRegistration::OnDiseaseCheckValue(){
	return 0;
} 
int CHMSRegistration::OnAddNewSelect(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	OnAddHMSRegistration();
	 return 0;
} 
int CHMSRegistration::OnEditSelect(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	OnEditHMSRegistration();
	 return 0;
} 

int CHMSRegistration::OnDeleteSelect(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	OnDeleteHMSRegistration();
	 return 0;
} 
int CHMSRegistration::OnSaveSelect(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	OnSaveHMSRegistration();
	 return 0;
} 
int CHMSRegistration::OnCancelSelect(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	OnCancelHMSRegistration();
	 return 0;
} 
int CHMSRegistration::OnPrintSelect(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	PrintReceipt(true);
	return 0;
} 
#include "HMSIntroductionDialog.h"
int CHMSRegistration::OnIntroductionSelect(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CHMSIntroductionDialog dlg(this);
	dlg.DoModal();
	return 0;
}
//#include "HMSParaclinicalDialogHR.h"
#include "HMSParaclinicalDialog.h"
int CHMSRegistration::OnThemDVSelect(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();

	if(pMF->m_nDocumentNo <= 0)
		return -1;

	if(m_szDocStatus == _T("T"))
	{
		ShowMessageBox(_T("Hồ sơ đã kết thúc. Không thể thêm dịch vụ"));
		return 0;
	}

	CHMSParaclinicalDialog dlg(this);	
	dlg.DoModal();
	return 0;
} 

int CHMSRegistration::OnPrintYCSDDVSelect(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();	
	static CReport rpt;
	CString szSQL, tmpStr, szReportName;
	CRecord rs(&pMF->m_db);
	CRecord rs1(&pMF->m_db);
	

	if(!rpt.Init(_T("Reports/HMS/HR_YECAUSUDUNGDV.RPT")) )
		return -1;
	szSQL.Format(_T(" SELECT 	hd_patientno as patientno,  ") \
		_T(" 	hd_docno as docno,") \
		_T(" 	trim(hp_surname||' '||hp_midname||' '||hp_firstname) as pname,") \
		_T(" 	date_part('year', hp_birthdate) as yearofbirth,") \
		_T(" 	hms_getage(date(hd_admitdate), hp_birthdate) as age,") \
		_T(" 	hp_sex as sexid,") \
		_T(" 	sys_sel_getname('sys_sex', hp_sex) as sex,") \
		_T(" 	hp_occupation as occupationid,") \
		_T(" 	sys_sel_getname('sys_occupation', cast(hp_occupation as text)) as occupation,") \
		_T(" 	hp_dtladdr as detailaddress,") \
		_T(" 	hp_provid as provid,") \
		_T(" 	(select sp_name from sys_prov where sp_id=hp_provid) as provill,") \
		_T(" 	hp_distid as distid,") \
		_T(" 	(select sd_name from sys_dist where sd_provid=hp_provid and sd_id=hp_distid) as district,") \
		_T(" 	hp_villid as villid,") \
		_T(" 	(select sv_name  from sys_vill where sv_provid=hp_provid and sv_distid=hp_distid and sv_id=hp_villid) as village,") \
		_T(" 	hp_workplaceid as workplaceid,") \
		_T(" 	hp_workplace as workplace,") \
		_T("	hp_cmnd as cmnd, hd_telephone as telephone, ") \
		_T(" 	hd_object as objectid,") \
		_T("	hd_insline as insline, ") \
		_T("	hd_emergency as emergency, ") \
		_T("	hd_disrate as disrate, ") \
		_T(" 	(SELECT ho_desc FROM hms_object WHERE ho_id=hd_object) as objectname,") \
		_T(" 	hd_cardno as cardno,") \
		_T(" 	hd_cardidx as cardidx,") \
		_T(" 	hc_regdate as regdate,") \
		_T(" 	hc_regcode as regcode,") \
		_T("	he_createdby,he_updatedby, ") \
		_T(" 	hc_expdate as expdate,") \
		_T(" 	(SELECT hfl_name FROM hms_feelist WHERE hfl_feeid=he_examtype) as examtype,") \
		_T(" 	(SELECT hrl_name FROM hms_roomlist WHERE hrl_deptid=he_deptid AND hrl_id=he_roomid) as roomname, ") \
		_T(" 	(SELECT hrl_section FROM hms_roomlist WHERE hrl_deptid=he_deptid AND hrl_id=he_roomid) as section, ") \
		_T("	he_roomid as roomid, ") \
		_T("	he_receptno as receptno, ") \
		_T("	he_deptid as deptid, ") \
		_T("	hfe_unitprice as amount, ") \
		_T("	hd_transplace as transplace, ") \
		_T("	hd_transdiagn as transdiagn, ")
		_T("	hd_xobject as xobject, ") \
		_T("	hd_xcardno as xcardno, ") \
		_T("	hd_xissuedate as xissuedate ") \
		_T(" FROM hms_patient") \
		_T(" LEFT JOIN hms_doc ON(hd_patientno=hp_patientno)") \
		_T(" LEFT JOIN hms_card ON(hc_patientno=hd_patientno and hc_cardno=hd_cardno and hc_idx=hd_cardidx) ") \
		_T(" LEFT JOIN hms_exam ON(he_docno=hd_docno)") \
		_T(" WHERE trim(he_deptid)='%s' AND he_docno=%ld AND he_receptidx=%d"), pMF->m_szDept, m_nDocumentNo, m_nReceptIdx);
//_fmsg(_T("%s"), szSQL);
	int ret = rs.ExecSQL(szSQL);
	if(rs.IsEOF())
		return -1;
	
	
	//Report Header
	rpt.GetReportHeader()->SetValue(_T("HEALTHSERVICE"), pMF->m_CompanyInfo.sc_pname);
	rpt.GetReportHeader()->SetValue(_T("HOSPITALNAME"), pMF->m_CompanyInfo.sc_name);
	tmpStr = pMF->GetSysDateTime();
	CString printDate;
	printDate.Format(rpt.GetReportHeader()->GetValue(_T("PrintDate")),tmpStr.Mid(11, 5), tmpStr.Mid(8, 2), tmpStr.Mid(5, 2), tmpStr.Left(4));
	
	rpt.GetReportHeader()->SetValue(_T("PrintDates"), CDate::Convert(tmpStr));
	rpt.GetReportHeader()->SetValue(_T("Gio"), pMF->GetSysTime().Left(5));
	rpt.GetReportHeader()->SetValue(_T("PrintDate"), printDate);
	rpt.GetReportHeader()->SetValue(_T("PatientNo"), rs.GetValue(_T("patientno")));

	StringUpper(rs.GetValue(_T("cmnd")), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("CMND"), tmpStr);

	rs.GetValue(_T("docno"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("DocumentNo"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("Barcode"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("Barcode[128A]"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("Barcode[128B]"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("Barcode[128C]"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("Barcode[39]"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("Barcode[93]"), tmpStr);


	StringUpper(rs.GetValue(_T("pname")), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("PatientName"), tmpStr);
	tmpStr.Empty();

	rpt.GetReportHeader()->SetValue(_T("yearofbirth"), rs.GetValue(_T("yearofbirth")));
	rpt.GetReportHeader()->SetValue(_T("Age"), rs.GetValue(_T("age")));
	rpt.GetReportHeader()->SetValue(_T("Sex"), rs.GetValue(_T("sex")));
	rpt.GetReportHeader()->SetValue(_T("Occupation"), rs.GetValue(_T("occupation")));
	tmpStr.Format(_T("%s - %s - %s"), rs.GetValue(_T("village")), rs.GetValue(_T("district")), rs.GetValue(_T("provill")));
	rpt.GetReportHeader()->SetValue(_T("Address"), tmpStr);
	rs.GetValue(_T("detailaddress"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("DetailAddress"), tmpStr);
	tmpStr.Empty();
	rpt.GetReportHeader()->SetValue(_T("WorkPlace"), rs.GetValue(_T("workplace")));
	rpt.GetReportHeader()->SetValue(_T("ExamRoom"), rs.GetValue(_T("roomname")));
	rpt.GetReportHeader()->SetValue(_T("section"), rs.GetValue(_T("section")));
	rpt.GetReportHeader()->SetValue(_T("Roomid"), rs.GetValue(_T("roomid")));
	
	rs.GetValue(_T("insline"), tmpStr);
	if(!rs.GetValue(_T("cardno")).IsEmpty())
	{
		if(tmpStr != _T("Y")){
			rpt.GetReportHeader()->SetValue(_T("insline"), _T("X"));
			rpt.GetReportHeader()->SetValue(_T("offinsline"), _T(""));
		}
		else
		{
			rpt.GetReportHeader()->SetValue(_T("insline"), _T(""));
			rpt.GetReportHeader()->SetValue(_T("offinsline"), _T("X"));
		}
	}
	else
	{
		rpt.GetReportHeader()->SetValue(_T("insline"), _T(""));
			rpt.GetReportHeader()->SetValue(_T("offinsline"), _T(""));
	}

	rs.GetValue(_T("emergency"), tmpStr);
	if(tmpStr == _T("Y")){
		rpt.GetReportHeader()->SetValue(_T("Emergency"), _T("X"));		
	}
	else
	{
		rpt.GetReportHeader()->SetValue(_T("Emergency"), _T(""));		
	}

	

	int nReceptNo=0;
	rs.GetValue(_T("receptno"), nReceptNo);
	rpt.GetReportHeader()->SetValue(_T("SheetNo"), rs.GetValue(_T("receptno")));
	tmpStr.Format(_T("%s.%0.2d"),rs.GetValue(_T("roomid")),nReceptNo);
	rpt.GetReportHeader()->SetValue(_T("SheetNoP"), tmpStr);	
	rpt.GetReportHeader()->SetValue(_T("ExamType"), rs.GetValue(_T("examtype")));
	rs.GetValue(_T("he_createdby"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("createdby"), pMF->GetDoctorName(tmpStr));
	rpt.GetReportHeader()->SetValue(_T("updatedby"), rs.GetValue(_T("he_updatedby")));	

	rpt.GetReportHeader()->SetValue(_T("Money"), rs.GetValue(_T("amount")));
	rpt.GetReportHeader()->SetValue(_T("ObjectName"), rs.GetValue(_T("objectname")));
	rs.GetValue(_T("cardno"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("CardNo"), tmpStr);
	rs.GetValue(_T("xobject"), tmpStr);
	if(pMF->m_szPrintHemaReceipt == _T("Y") && tmpStr == _T("H")){
		rpt.GetReportHeader()->SetValue(_T("Hema"), _T("HEMA"));
	}
	rpt.GetReportHeader()->SetValue(_T("RegDate"), CDate::Convert(rs.GetValue(_T("regdate"))));
	rpt.GetReportHeader()->SetValue(_T("ExpDate"), CDate::Convert(rs.GetValue(_T("expdate"))));
	rpt.GetReportHeader()->SetValue(_T("TransferHospital"), rs.GetValue(_T("transplace")));
	rpt.GetReportHeader()->SetValue(_T("TransferDiagnosis"), rs.GetValue(_T("transdiagn")));
	tmpStr.Empty();

	rpt.GetReportHeader()->SetValue(_T("telephone"), rs.GetValue(_T("telephone")));
	
	
	szSQL.Format(_T(" select * from hms_receiptprint "));
	rs1.ExecSQL(szSQL);
	if(!rs1.IsEOF()){
		if(rs.GetValue(_T("objectid")) == _T("9"))
			rs1.GetValue(_T("hsr_service"), tmpStr);
		else
			if(ToInt(rs.GetValue(_T("disrate"))) == 100)
				rs1.GetValue(_T("hsr_insrate"), tmpStr);
			else
				rs1.GetValue(_T("hsr_insrate1"), tmpStr);
	}

	rpt.GetReportHeader()->SetValue(_T("desc"), tmpStr);
	
	rs.GetValue(_T("xcardno"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("xcardno"), tmpStr);	
	rs.GetValue(_T("xissuedate"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("xissuedate"), CDate::Convert(tmpStr));

	tmpStr.Empty();
	rs.GetValue(_T("regcode"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("RegCode"), tmpStr);
	if(!tmpStr.IsEmpty()){
		szSQL.Format(_T("SELECT hh_name FROM hms_hospital WHERE hh_code ='%s' LIMIT 1 "), tmpStr);
		rs.ExecSQL(szSQL);
		rs.GetValue(_T("hh_name"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("RegName"), tmpStr);
	}
	

	szSQL.Format(_T("SELECT * FROM hms_khamsan WHERE hek_sohoso = %ld"), m_nDocumentNo);
	rs.ExecSQL(szSQL);	
	if(!rs.IsEOF())
	{
		rs.GetValue(_T("hek_para"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_para"), tmpStr);
		rs.GetValue(_T("hek_kehoach"), tmpStr);		
		rpt.GetReportHeader()->SetValue(_T("hek_kehoach"), tmpStr);
		rs.GetValue(_T("hek_tc"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_tc"), tmpStr);
		rs.GetValue(_T("hek_kycuoi"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_kycuoi"), tmpStr);
		rs.GetValue(_T("hek_ckk"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_ckk"), tmpStr);
		rs.GetValue(_T("hek_lydokham"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_lydokham"), tmpStr);
		
		rs.GetValue(_T("hek_lankham"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_lankham"), tmpStr);

		rs.GetValue(_T("hek_sodatlich"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_sodatlich"), tmpStr);
	}

	rpt.Print();
	return 0;
} 

//Them benh nhan moi.
int CHMSRegistration::OnAddHMSRegistration(){
//Kiem tra neu dang co tac vu them hoac sua thong tin benh nhan thi ko cho phep them moi
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd(); 

	int nMode = GetMode();

	
	if(nMode == VM_ADDPAT || nMode == VM_ADDDOC || nMode == VM_ADDEXAM || nMode == VM_EDIT ) 
		return -1; 
 	CString szTitle;
	pMF->SetStatusText(_T("Add new patient"));

	nMode = VM_ADDPAT;
	szTitle = _T("Add New Patient");
	m_sCardInfo.code.Empty();
	m_sCardInfo.company.Empty();
	m_sCardInfo.discount = 0;
	m_sCardInfo.expdate.Empty();
	m_sCardInfo.expdate.Empty();
	m_sCardInfo.regplacecde.Empty();
	
 	SetMode(nMode);
	return 0; 
} 
int CHMSRegistration::OnEditCardInformation(){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL, szCurrentUser;
	szCurrentUser = pMF->GetCurrentUser();
	if (m_szCardNo.IsEmpty()) return -1;	

	if(!pMF->CheckPermission(_T("01.10")))
	{
		ShowMessageBox(_T("Permission Denined."),MB_ICONWARNING);
		return -1;
	}
	if (szCurrentUser.CompareNoCase(_T("admin")) != 0 )
	{
//		ShowMessageBox(_T("Only a system administrator perform new tasks on"),MB_ICONWARNING);
//		return -1;
	}
	
	//CHMSInsregDateDialog dlg(this);
	CHMSInsuranceCardSettingDialog dlg(this);
	dlg.m_szApplyDate = m_szExamDate;
	dlg.m_nPatientNo = m_nPatientNo;
	dlg.m_nDocumentNo = m_nDocumentNo;
	dlg.m_nCardIdx = m_nCardIdx;
	if(m_szOffLine == _T("Y"))
		dlg.m_bOffLine = TRUE;
	else
		dlg.m_bOffLine = FALSE;

	szSQL.Format(_T("SELECT hd_insregdate FROM hms_doc WHERE hd_docno =%ld "), m_nDocumentNo);	
	rs.ExecSQL(szSQL);
	if( !rs.IsEOF())
	{
		rs.GetValue(_T("hd_insregdate"), dlg.m_szApplyDate);
	}
	dlg.DoModal();
	GetDataToScreen();
	return 0;
}

int CHMSRegistration::OnEditHMSRegistration(){
 	if(GetMode() != VM_VIEW) 
 		return -1; 
 	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd(); 
	SetMode(VM_EDIT);

	if(m_szExamStatus != _T("O")){
		m_wndExamType.EnableWindow(false);
		m_wndRoom.EnableWindow(false);
	}

	CRecord rs(&pMF->m_db);
	CRecord rs1(&pMF->m_db);
	CString szSQL;
	bool bEditFalse = false;
	

	if(pMF->CheckPermission(_T("01.11")))
	{
		szSQL.Format(_T("SELECT count(*) FROM hms_fee_invoice WHERE hfi_docno=%ld and hfi_cardidx=%ld and hfi_type ='P' "), m_nDocumentNo, m_nCardIdx);
		rs.ExecSQL(szSQL);
		if(rs.GetIntValue() > 0){
			m_wndObject.EnableWindow(false);
			m_wndCardNoButton.EnableWindow(false);
		}
		else
		{
			m_wndObject.EnableWindow(true);
			m_wndCardNoButton.EnableWindow(true);		
		}
	}	

	if(pMF->CheckPermission(_T("01.12")))
	{
		m_wndObject.EnableWindow(true);
		m_wndCardNoButton.EnableWindow(true);		
	}

	if(pMF->CheckPermission(_T("01.13")))
	{	
		m_wndPatientName.EnableWindow(true);
		m_wndSex.EnableWindow(true);
		m_wndAge.EnableWindow(true);
		m_wndExamType.EnableWindow(true);
		m_wndRoom.EnableWindow(true);
	}

	if(pMF->GetCurrentUser().MakeUpper() == _T("ADMIN"))
	{	
		m_wndObject.EnableWindow(true);
		m_wndCardNoButton.EnableWindow(true);
		m_wndPatientName.EnableWindow(true);
		m_wndSex.EnableWindow(true);
		m_wndAge.EnableWindow(true);
		m_wndExamType.EnableWindow(true);
		m_wndRoom.EnableWindow(true);		
	}
	
	return 0; 
} 
int CHMSRegistration::OnDeleteHMSRegistration(){
 	if(GetMode() != VM_VIEW) 
 		return -1; 
 	CMainFrame *pMF = (CMainFrame *)AfxGetMainWnd(); 
 	CString szSQL; 
	CString szWhere; 
	CRecord rs(&pMF->m_db);

	if(!pMF->CheckPermission(_T("01.03")))
	{
		ShowMessageBox(_T("Permission Denined."), 0);
		return 0;
	}
	if(m_szExamStatus != _T("O"))
	{
		ShowMessageBox(_T("Cannot process with current status"));
		return 0;
	}
	
	
	szSQL.Format(_T("SELECT count(*) ") \
	_T("FROM hms_fee_invoice ") \
	_T("WHERE hfi_docno=%ld and hfi_type='A'"),	m_nDocumentNo);

	rs.ExecSQL(szSQL);
	if(rs.GetIntValue() > 0){
		ShowMessageBox(_T("This patient payment exam fee. Cannot delete it"));
		return 0;
	}


	szSQL.Format(_T("SELECT count(*) ") \
		_T("FROM hmsv_fee ") \
		_T("WHERE hfe_docno=%ld and hfe_deptid='%s' ") \
		_T(" and hfe_roomid=%d and hfe_type='E' ") \
		_T(" and hfe_status='P' and hfe_idx ='%s'"),
		m_nDocumentNo, pMF->m_szDept, str2int(m_szRoomKey), m_szExamTypeKey);
	
	rs.ExecSQL(szSQL);
	if(rs.GetIntValue() > 0){
		ShowMessageBox(_T("This patient payment exam fee. Cannot delete it"));
		return 0;
	}

	szSQL.Format(_T("SELECT count(*) FROM pcms_order ") \
		_T("WHERE pcmso_docno=%ld and pcmso_deptid='%s' and pcmso_roomid=%d"),
		pMF->m_nDocumentNo, pMF->m_szDept, str2int(m_szRoomKey));
	rs.ExecSQL(szSQL);

	if(rs.GetIntValue() > 0){
		ShowMessageBox(_T("This reception has been add paraclinical order. Cannot delete it"));
		return 0;
	}

 	if(ShowMessage(1, MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2) == IDNO) 
 		return -1; 
	if(pMF->m_szAutoPayment != _T("Y"))
		szWhere.Format(_T(" AND he_payment <> 'Y' "));
	else
		szWhere.Empty();
	szSQL.Format(_T("DELETE FROM hms_exam WHERE he_docno=%ld and he_receptidx=%d AND he_status='O' %s "), m_nDocumentNo, m_nReceptIdx, szWhere); 
 	int ret = pMF->ExecSQL(szSQL); 
 	if(ret >= 0){ 
		//Luu lai thong tin xoa phieu kham
		m_szDesc.Empty();
		m_szDesc.Format(_T("M\xE3 BN[%ld] M\xE3 HS[%ld] T\xEAn \x62\x1EC7nh nh\xE2n[%s]"), m_nPatientNo, m_nDocumentNo, m_szPatientName);
		pMF->SystemLog(_T("Delete"), m_szDesc);

		szSQL.Format(_T("DELETE ") \
		_T("FROM hms_other_fee ") \
		_T("WHERE hfe_docno=%ld and hfe_deptid='%s' ") \
		_T(" and hfe_roomid=%d and hfe_type='E' ") \
		_T(" and hfe_itemid='%s' and hfe_status<>'P' "),
		m_nDocumentNo, pMF->m_szDept, str2int(m_szRoomKey), m_szExamType);
		pMF->ExecSQL(szSQL);

		szSQL.Format(_T("DELETE FROM hms_exam WHERE he_docno=%ld and he_examtype='%s' and he_hasfee='Y' and he_payment <>'Y' and he_status='O' "), m_nDocumentNo, m_szExamTypeKey);
		pMF->ExecSQL(szSQL);

		szSQL.Format(_T("DELETE FROM hms_doc WHERE hd_docno=%ld and hd_docno not in(SELECT he_docno FROM hms_exam WHERE he_docno=%ld) "), m_nDocumentNo, m_nDocumentNo);
		ret = pMF->ExecSQL(szSQL); 
		if(ret >= 0){
			//Kiem tra neu the cu thi xoa di
			szSQL.Format(_T("SELECT COUNT(*) FROM hms_doc WHERE hd_docno=%ld AND hd_cardno='%s' AND hd_cardidx=%ld "), m_nDocumentNo, m_szCardNo, m_nCardIdx);
			rs.ExecSQL(szSQL);			
			if(rs.GetIntValue() <= 0)
			{
				szSQL.Format(_T("DELETE FROM hms_card WHERE hc_patientno=%ld and upper(hc_cardno)=upper('%s') AND hc_idx=%ld") , m_nPatientNo, m_szCardNo, m_nCardIdx);
		pMF->ExecSQL(szSQL);
			}
		}

		m_nDocumentNo = 0;
		szSQL.Format(_T("SELECT count(*) FROM hms_doc WHERE hd_patientno=%ld"), m_nPatientNo);
		rs.ExecSQL(szSQL);
		if(rs.GetIntValue() <= 0)
		{
			szSQL.Format(_T("DELETE FROM hms_card WHERE hc_patientno=%ld"), m_nPatientNo);
			pMF->ExecSQL(szSQL);

			szSQL.Format(_T("DELETE FROM hms_patient WHERE hp_patientno=%ld"), m_nPatientNo);
			pMF->ExecSQL(szSQL);			
			m_nPatientNo = 0;
		}
 		SetMode(VM_NONE); 
 		OnCancelHMSRegistration(); 
		pMF->m_wndExaminationQueue.RefreshData();
 	}
	else
		ShowMessageBox(_T("Can not delete reception"), MB_OK);
	return 0;
 } 
int CHMSRegistration::OnSaveHMSRegistration(){
	CMainFrame *pMF = (CMainFrame *)AfxGetMainWnd(); 
	int nMode = GetMode();

	if(nMode != VM_ADDPAT && nMode != VM_ADDDOC && nMode != VM_ADDEXAM && nMode != VM_EDIT ) 
 		return -1; 
	
	bool bAddPat=false, bAddDoc=false, bAddExam=false;
	long nCardIdx=0;
	CString szWhere; 
	CString szSQL, insCardSQL;
	CRecord rs(&pMF->m_db);
	CRecord rsCard(&pMF->m_db);

	m_szObjectKey.Trim();
	
	if(!IsValidateData()) 
	{
 		return -1; 
	}
	
	if(m_szObjectKey.IsEmpty())
	{
		m_wndObject.SetFocus();
		return -1;
	}

	CString szObjType = m_wndObject.GetCurrent(3);
	CString szHasCard = m_wndObject.GetCurrent(2);
	if((szObjType == _T("I") || szObjType == _T("C")) && (m_szCardNo.IsEmpty() && szHasCard == _T("Y")))
	{
		int nMsg = ShowMessageBox(_T("Benh nhan chua nhap the BHYT."), MB_OK);
		return 0;
	}
	
	// Neu la dich vu thi gan the = rang
	if(szObjType == _T("S"))
	{
		m_szCardNo.Empty();
	}

	// Kiem tra the BHYT da duoc su dung boi benh nhan nao chua
	if (!m_szCardNo.IsEmpty())
	{
		
		szSQL.Format(_T("SELECT * FROM hms_card WHERE upper(hc_cardno)=upper('%s') AND hc_active ='Y'  ORDER BY hc_active desc,hc_expdate desc,hc_createddate desc "), m_szCardNo);
		rs.ExecSQL(szSQL);		
		if(!rs.IsEOF()){
			long nPatientNo;
			rs.GetValue(_T("hc_patientno"), nPatientNo);
			if(nPatientNo != m_nPatientNo)
			{
				CString szMsg;
				szMsg.Format(_T("This card is using by other patient.[%ld]"), nPatientNo);
				ShowMessageBox(szMsg, MB_ICONWARNING|MB_OK);
				return -1;
			}
			rs.GetValue(_T("hc_idx"), nCardIdx);
		}
	}

	pMF->BeginTransaction();
	if(nMode==VM_ADDPAT)
	{
		bAddPat = true;
		bAddDoc = true;
		bAddExam = true;
	}
	else if(nMode == VM_ADDDOC)
	{
		bAddDoc = true;
		bAddExam = true;
	}
	else if(nMode == VM_ADDEXAM){
		bAddExam = true;
	}


	if(bAddPat)
	{
		szSQL.Format(_T("SELECT nextval('hms_patient_hp_patientno_seq') "));

		rs.ExecSQL(szSQL);
		m_nPatientNo = rs.GetIntValue();
		
	}

	if(bAddDoc)
	{
		szSQL.Format(_T("SELECT nextval('hms_doc_hd_docno_seq') "));
		rs.ExecSQL(szSQL);
		m_nDocumentNo = rs.GetIntValue();
	}
	
	m_hms_patientTbl.SetValue(_T("hp_patientno"), m_nPatientNo);
	
	m_hms_docTbl.SetValue(_T("hd_patientno"), m_nPatientNo); 
	m_hms_docTbl.SetValue(_T("hd_docno"), m_nDocumentNo); 
	m_hms_examTbl.SetValue(_T("he_patientno"), m_nPatientNo); 
	m_hms_examTbl.SetValue(_T("he_docno"), m_nDocumentNo); 
	m_hms_cardTbl.SetValue(_T("hc_patientno"), m_nPatientNo); 


	if((bAddExam) || nMode == VM_EDIT){
		if(bAddExam)
			m_szCurRoom.Empty();
		
		if(m_szCurRoom != m_szRoomKey)
		{
			szSQL.Format(_T("SELECT max(he_receptno) ") \
				_T("FROM hms_exam  ") \
			_T("WHERE trim(he_deptid)='%s' and he_roomid=%d AND date(he_examdate) = date('%s') "), 
					m_szDept, ToLong(m_szRoomKey), m_szExamDate);

			rs.ExecSQL(szSQL);
			m_nReceptNo = rs.GetIntValue()+1;
		}
		
		
		if(bAddExam)
		{
			if(bAddDoc)
				m_nReceptIdx = 1;
			else
			{
				szSQL.Format(_T(" SELECT max(he_receptidx) ") \
				_T(" FROM hms_exam  ") \
				_T(" WHERE he_docno=%ld "), m_nDocumentNo);
				rs.ExecSQL(szSQL);
				m_nReceptIdx = rs.GetIntValue()+1;
			}
			m_szExamStatus = _T("O");	
		}
			
		m_hms_examTbl.SetValue(_T("he_receptno"), m_nReceptNo); 
		m_hms_examTbl.SetValue(_T("he_receptidx"), m_nReceptIdx); 
		m_hms_examTbl.SetValue(_T("he_status"), m_szExamStatus);

	}

//Neu khong co the thi them the vao
//Truong hop co the BHYT
	if(!m_szCardNo.IsEmpty()){
//Neu them moi benh nhan thi them moi the BHYT
		m_hms_cardTbl.SetValue(_T("hc_patientno"), m_nPatientNo);
		if(bAddPat || bAddDoc)
		{
			m_nCardIdx = 1;
			szSQL.Format(_T("SELECT nextval('hms_card_hc_idx_seq') "));
			rs.ExecSQL(szSQL);
			m_nCardIdx = rs.GetIntValue();

			m_hms_cardTbl.SetValue(_T("hc_idx"), m_nCardIdx);
			insCardSQL = m_hms_cardTbl.GetInsertSQL();
			
		}
		else if(GetMode() == VM_EDIT)
		{
			int nCount =0;
			szSQL.Format(_T("SELECT COUNT(*) FROM hms_doc WHERE hd_docno =%ld AND hd_cardidx = %ld  AND upper(hd_cardno)=upper('%s')"), m_nDocumentNo, m_nCardIdx,m_szCardNo);
			rs.ExecSQL(szSQL);
			nCount = rs.GetIntValue();
			if(nCount > 0)
			{
				m_hms_cardTbl.SetValue(_T("hc_idx"), m_nCardIdx);
				insCardSQL = m_hms_cardTbl.GetUpdateSQL(_T("hc_patientno,hc_idx"));
				insCardSQL.AppendFormat(_T(" WHERE hc_patientno=%ld and hc_cardno='%s' and hc_idx=%ld"), m_nPatientNo, m_szCardNo, m_nCardIdx);
			}
			else
			{
				szSQL.Format(_T("SELECT nextval('hms_card_hc_idx_seq') "));
				rs.ExecSQL(szSQL);
				m_nCardIdx = rs.GetIntValue();
					
				m_hms_cardTbl.SetValue(_T("hc_idx"), m_nCardIdx);
				insCardSQL = m_hms_cardTbl.GetInsertSQL();
			}

		}
		
		szSQL.Format(_T("UPDATE hms_patient SET hp_workplace ='%s' WHERE hp_patientno = %ld"), m_sCardInfo.company, m_nPatientNo);
		//_msg(_T("%s"), szSQL);
		pMF->ExecSQL(szSQL);
		
	}
	else
	{
		m_nCardIdx = 0;
		m_nDisrate = 0;
		CString szObjectType = m_wndObject.GetCurrent(3);
		if(szObjectType == _T("D") || szObjectType == _T("C") )
			m_nDisrate = ToInt(m_wndObject.GetCurrent(4));
		if(m_szOffLine == _T("Y") && pMF->m_nInsOffLinePayment > 0)
				m_nDisrate = pMF->m_nInsOffLinePayment;
		
		m_hms_docTbl.SetValue(_T("hd_disrate"), m_nDisrate);
		m_hms_docTbl.SetValue(_T("hd_insline"), m_szOffLine);
	}
	m_hms_docTbl.SetValue(_T("hd_cardidx"), m_nCardIdx);
	m_hms_docTbl.SetValue(_T("hd_cardno"), m_szCardNo);
	m_hms_docTbl.SetValue(_T("hd_insregdate"), m_szExamDate);
	m_hms_docTbl.SetValue(_T("hd_datediscountall"), m_szDateDiscount); 

//Kiem tra neu tao phieu kham moi
//Neu da ton tai phieu kham tai phong duoc chi ding trong ngay thi ko cho tao nua

	if(bAddExam)
	{
		szSQL.Format(_T("SELECT Count(*) ") \
			_T("FROM ") \
			_T("	hms_exam ") \
			_T("WHERE ") \
			_T("	he_docno=%ld ") \
			_T("	AND date(he_examdate)=date('%s') " ) \
			_T("	AND he_roomid=%ld "), m_nDocumentNo, m_szExamDate, ToLong(m_szRoomKey));
		rs.ExecSQL(szSQL);
		if(rs.GetIntValue() > 0)
		{
			ShowMessageBox(_T("The Examination sheet is existing in the room selected"), MB_OK|MB_ICONWARNING);
			pMF->Rollback();
			return -1;
		}
	}

	int ret=-1;
	CString szString;

	if(bAddExam)
	{
//Them benh nhan moi
 		if(bAddPat){ 
 			szSQL = m_hms_patientTbl.GetInsertSQL();
			szString.AppendFormat(_T("%s"), szSQL);
			ret = pMF->ExecSQL(szSQL);
			if(ret <= 0) {
				pMF->Rollback();
				ShowMessageBox(_T("Can not add new patient information"), MB_OK);
				return -1;
			}
		}
//Tao ho so kham moi 
		if(bAddDoc)
		{
			szSQL = m_hms_docTbl.GetInsertSQL(); 


			ret = pMF->ExecSQL(szSQL); 
			if(ret <= 0) {
				pMF->Rollback();
				ShowMessageBox(_T("Can not add new document information"), MB_OK);
				return -1;
			}		

			pMF->ExecSQL(insCardSQL);

		}
			
		szSQL = m_hms_examTbl.GetInsertSQL(); 
		szString.AppendFormat(_T("%s"), szSQL);

		ret = pMF->ExecSQL(szSQL); 


		if(ret <= 0) {
			pMF->Rollback();
			ShowMessageBox(_T("Can not add new examination receipt"), MB_OK);
			return -1;
		}

		// Tao thong tin san khoa
		CString szSQLSK;
		szSQLSK.Format(_T("SELECT hms_khamsan_insert(%ld, %ld, %d)"), m_nPatientNo, m_nDocumentNo, m_nReceptIdx);
		//_msg(_T("%s"), szSQLSK);
		pMF->ExecSQL(szSQLSK);

		int nMultiroom = ToInt(m_wndExamType.GetCurrent(5));
		if(nMultiroom == 1)
		{
			for (int i =0; i < m_arrayRoom.GetCount(); i++){
				int nRoom = m_arrayRoom[i];
				if(nRoom != ToInt(m_szRoomKey)){
					szSQL.Format(_T("SELECT count(*) ") \
						_T("FROM hms_exam  ") \
						_T("WHERE he_docno=%ld and trim(he_deptid)='%s' and he_roomid=%d AND date(he_examdate) = date('%s') "), 
							m_nDocumentNo, m_szDept, nRoom, m_szExamDate);
					rs.ExecSQL(szSQL);
					if(rs.GetIntValue() <= 0)
					{
						szSQL.Format(_T("SELECT coalesce(max(he_receptno),0)+1 ") \
							_T("FROM hms_exam  ") \
							_T("WHERE trim(he_deptid)='%s' and he_roomid=%d AND date(he_examdate) = date('%s') ; "), 
								m_szDept, nRoom, m_szExamDate);

						rs.ExecSQL(szSQL);
						m_nReceptNo = rs.GetIntValue();
						szSQL.Format(_T(" SELECT coalesce(max(he_receptidx),0)+1 ") \
							_T(" FROM hms_exam  ") \
							_T(" WHERE he_docno=%ld "), m_nDocumentNo);
						rs.ExecSQL(szSQL);
						m_nReceptIdx = rs.GetIntValue();
						m_hms_examTbl.SetValue(_T("he_receptno"), m_nReceptNo); 
						m_hms_examTbl.SetValue(_T("he_receptidx"), m_nReceptIdx); 
						m_hms_examTbl.SetValue(_T("he_hasfee"), _T("Y")); 
						m_hms_examTbl.SetValue(_T("he_roomid"), nRoom);
						m_hms_examTbl.SetValue(_T("he_hasfee"), _T("N"));
						szSQL = m_hms_examTbl.GetInsertSQL(); 
						ret = pMF->ExecSQL(szSQL); 
						if(ret <= 0) {
						}
					}
				}

			}
			m_arrayRoom.RemoveAll();
		}
		//Kiem tra neu la doi tuong dich vu va tu dong tao hoa don thu phi kham
		CString tmpStr, szDesc, szRevcDate, szBookNo;
		tmpStr = m_wndObject.GetCurrent(3);
		szDesc = m_wndExamType.GetCurrent(1);
		szRevcDate = pMF->GetSysDateTime();			
		
		szBookNo.Format(_T("%d%d%d"), ToInt(szRevcDate.Mid(2,2)), ToInt(szRevcDate.Mid(5,2)), ToInt(szRevcDate.Mid(8,2)));
		if(pMF->CheckPermission(_T("01.17")))
		{
			if(pMF->m_szAutoPayment == _T("Y") && tmpStr == _T("S")){
				szSQL.Format(_T("select hms_fee_create('%s', %ld) "), pMF->GetCurrentUser(), m_nDocumentNo);
				pMF->ExecSQL(szSQL);					

				szSQL.Format(_T("select hms_fee_createinvoice_exam(%ld, '%s', %s, %ld, '%s', '%s', '%s') "),
					m_nDocumentNo, _T("AUTO"), szBookNo, pMF->GetLastRecvNo(),szRevcDate, pMF->GetCurrentUser(), szDesc);					
				pMF->ExecSQL(szSQL);			
			}
		}

 	} 
 	else if(nMode == VM_EDIT){ 
//Cap nhat thong  tin benh nhan
 		szWhere.Format(_T(" WHERE hp_patientno=%ld "), m_nPatientNo); 
 		szSQL = m_hms_patientTbl.GetUpdateSQL(_T("hp_createdby,hp_createddate,hp_patientno")); 
 		szSQL += szWhere;
		ret = pMF->ExecSQL(szSQL); 
		if(ret <= 0) {
			pMF->Rollback();
			ShowMessageBox(_T("Can not update patient information"), MB_OK);
			return -1;
		}
		
		// Phan luu lai thong tin sua (ten bn, object ...)
		bool bEditInformation = false;
		m_szDesc.Empty();
		m_szDesc.AppendFormat(_T("M\xE3 HS[%ld] "), m_nDocumentNo);
		
		if(m_szPatientName != m_szPatientNameOld)
		{			
			m_szDesc.AppendFormat(_T("T\xEAn \x63\x169:[%s] t\xEAn m\x1EDBi[%s]; \n"), m_szPatientNameOld,m_szPatientName);
			bEditInformation = true;
		}

		if(m_szObjectOld != m_szObjectKey)
		{			
			m_szDesc.AppendFormat(_T("\x110\x1ED1i t\x1B0\x1EE3ng \x63\x169[%s] m\x1EDBi [%s];  \n"), m_szObjectOld,m_szObjectKey);
			bEditInformation = true;
		}

		if(m_szExamTypeKey != m_szExamTypeOld)
		{			
			m_szDesc.AppendFormat(_T("Ki\x1EC3u kh\xE1m \x63\x169[%s] m\x1EDBi [%s]; \n"), m_szExamTypeOld,m_szExamTypeKey);
			bEditInformation = true;
		}

		if(m_szRoomKey != m_szRoomNameOld)
		{			
			m_szDesc.AppendFormat(_T("Ph\xF2ng kh\xE1m \x63\x169 [%s] m\x1EDBi [%s]; \n"), m_szRoomNameOld,m_szRoomKey);
			bEditInformation = true;
		}
		
		if(m_szCardNo != m_szCurCardNo)
		{			
			m_szDesc.AppendFormat(_T("Th\x1EBB BHYT \x63\x169[%s] m\x1EDBi [%s]; \n"), m_szCurCardNo,m_szCardNo);
			bEditInformation = true;
		}
		
		// Neu co su thay doi du lieu thi moi luu lai log;
		if(bEditInformation)
			pMF->SystemLog(_T("Edit"), m_szDesc);

//Cap nhat thong tin ho so kham va dieu tri
		szWhere.Format(_T(" WHERE hd_docno=%ld "), m_nDocumentNo); 
 		szSQL = m_hms_docTbl.GetUpdateSQL(_T("hd_createdby,hd_createddate,hd_docno,hd_patientno,hd_status,hd_admitdate,hd_admitdept,hd_xobject,hd_xcardno,hd_xissuedate,hd_xissueplace")); 
 		szSQL += szWhere; 

		ret = pMF->ExecSQL(szSQL); 
		if(ret <= 0) {
			pMF->Rollback();
			ShowMessageBox(_T("Can not update document information"), MB_OK);
			return -1;
		}
		
//Cap nhat thong tin phieu kham
		
		CString szWhere;
		/*if(pMF->GetCurrentUser().MakeUpper() != _T("ADMIN") || !pMF->CheckPermission(_T("01.13")))		
			szWhere.Format(_T(" AND he_status='O' "));
		else*/

		m_hms_examTbl.SetValue(_T("he_hasfee"), _T("Y")); 

		szWhere.Format(_T(" WHERE he_docno=%ld AND he_receptidx=%d %s "), m_nDocumentNo, m_nReceptIdx, szWhere); 
 		szSQL = m_hms_examTbl.GetUpdateSQL(_T("he_createdby,he_createddate,he_docno,he_receptidx,he_examdate, he_doctor, he_examine, he_prediagnostic, he_diagnostic")); 
 		szSQL += szWhere; 
		ret = pMF->ExecSQL(szSQL); 
	//_msg(_T("%s"), szSQL);
		if(ret <= 0) {
			pMF->Rollback();
			ShowMessageBox(_T("Can not update examination receipt"), MB_OK);
			return -1;
		}
		// Xoa the BHYT khi chuyen tu doi tuong BH->DV
		if(m_szCardNo.IsEmpty())
		{
			szSQL.Format(_T("SELECT COUNT(*) FROM hms_doc WHERE hd_docno =%ld AND hd_cardidx = %ld  AND upper(hd_cardno)=upper('%s')"), m_nDocumentNo, m_nCardIdxOld,m_szCardNoOld);
			rs.ExecSQL(szSQL);
			if(rs.GetIntValue() <= 0){
				//szSQL.Format(_T("DELETE FROM hms_card WHERE hc_patientno=%ld AND hc_idx = %ld  AND upper(hc_cardno)=upper('%s')"), m_nPatientNo, m_nCardIdxOld, m_szCardNoOld);
				szSQL.Format(_T("UPDATE hms_card SET hc_active = 'N' WHERE hc_patientno=%ld AND hc_idx = %ld  AND upper(hc_cardno)=upper('%s')"), m_nPatientNo, m_nCardIdxOld, m_szCardNoOld);
				pMF->ExecSQL(szSQL);
			}
		}

		// Goi cau lenh xu ly hms_Card

		pMF->ExecSQL(insCardSQL);
 	} 
	pMF->Commit();
	m_szCurRoom = m_szRoomKey;

	/*if(bAddExam)
	{
		CString tmpStr2;
		tmpStr2.Format(_T("D0000%.3d"), str2int(m_szExamTypeKey));
		szSQL.Format(_T("select hms_autoadd_paraclinical(%ld, %ld, '%s', %d, %d, '%s', '%s')"), 
				m_nPatientNo, m_nDocumentNo, m_szDept, str2int(m_szRoomKey), m_nReceptIdx, tmpStr2, _T(""));
		pMF->ExecSQL(szSQL);
	}*/

	// tao phi CLS theo goi chuyen khoa kham
	m_szRefItemID = m_wndExamType.GetCurrent(4).Trim();
	if(!m_szRefItemID.IsEmpty()){
		szSQL.Format(_T("SELECT pcms_order_additem('%s', '%s', %ld, %ld, %d, '%s', '%s', '%s', '%s')"), pMF->GetCurrentUser(), m_szDept, m_nPatientNo, m_nDocumentNo, ToInt(m_szRoomKey), m_szExamDate, pMF->GetCurrentUser(), _T("D0000"), m_szRefItemID);
		pMF->ExecSQL(szSQL);
	}

	//_msg(_T("%s., %s"), szSQL, m_szRefItemID);

	szSQL.Format(_T("select hms_fee_create('%s', %ld)"), pMF->GetCurrentUser(), m_nDocumentNo);
	pMF->ExecSQL(szSQL);

	pMF->m_nDocumentNo = m_nDocumentNo;
	pMF->m_nRefIndex = m_nReceptIdx;
	pMF->m_nReceptNo = m_nReceptNo;
	pMF->m_nPatientNo = m_nPatientNo;
	m_szOldCardNo = m_szCardNo;

	OnRoomListLoadData();
	OnExamListLoadData();
	if(pMF->m_szAutoPrint==_T("Y"))
		PrintReceipt();
	pMF->m_wndExaminationQueue.OnPatientListLoadData();
	m_szSheetNo.Format(_T("%s.%d"), m_szRoomKey, m_nReceptNo);
	SetMode(VM_VIEW); 
	m_wndCardNoFind.SetFocus();
 	return ret; 
}
int CHMSRegistration::OnCancelHMSRegistration(){
 	if(GetMode() == VM_ADDPAT) 
 	{ 
 		SetMode(VM_NONE); 
 	} 

 	else 
 	{ 
		GetDataToScreen();
 	} 
 	return 0;
} 

int CHMSRegistration::OnAddNewDocument(){
	CMainFrame *pMF = (CMainFrame *)AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString tmpStr,szMsg, szSQL;
	if(m_nPatientNo <= 0)
		return -1;

	if(m_szDocStatus != _T("T"))
	{
		int ret = ShowMessageBox(_T("This document is opening. Do you want to create new document"), MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2);
		if(ret == IDNO)
			return -1;
	}
	
	// Kiem tra benh nhan co the BHYT trong ngay khong duoc phep tao moi ho so.
	if (pMF->IsPatientInsuranceDaily(m_szCardNo, m_nPatientNo)==true)	{		
		ShowMessageBox(_T("This document is had. Unable to create new document"), MB_OK|MB_ICONWARNING);
		return -1;
	}
	
	// Kiem tra ho so co dang dieu tri ngoai tru khong. Neu dang dieu tri ngoai tru, khong cho tao ho so moi.
	szSQL.Format(_T("SELECT count(*) FROM hms_outpatient WHERE hop_docno=%ld AND hop_status IN('O') "), pMF->m_nDocumentNo);
	rs.ExecSQL(szSQL);
	if(rs.GetIntValue() > 0)
	{
		ShowMessageBox(_T("This patient is out treatment. Unable to create new document"), MB_OK|MB_ICONWARNING);
		return -1;
	}

	// Kiem tra benh nhan co dang dieu tri noi tru khong. (True, False)  benh nhan dang dieu tri 
	if (pMF->IsTreatmentTerminate(m_nPatientNo)==true)	{	
		TranslateString(_T("This document is treatment [%s]. Unable to create new document"), tmpStr);
		szMsg.Format(tmpStr, pMF->m_szDeptName);		
		ShowMessageBox(szMsg, MB_OK|MB_ICONWARNING);
		return -1;
	}


	// Kiem tra neu benh nhan lan truoc kham, chua den ngay kham tiep thi co canh bao
	_tprintf(_T("\r\n%d"), pMF->m_nInsnumberExam);
	if(pMF->m_nInsnumberExam > 0 && !m_szCardNo.IsEmpty())
	{
		szSQL.Format(_T("SELECT MAX(date(he_examdate)) as he_examdate FROM hms_exam WHERE he_patientno=%ld"), m_nPatientNo);
		rs.ExecSQL(szSQL);
		CString szDate, szCurrentDate;
		if(!rs.IsEOF())
		{
			rs.GetValue(_T("he_examdate"), szDate);
		}
		szCurrentDate = pMF->GetSysDate();
		int nMaxDays = CompareDate(szCurrentDate, szDate);
		_tprintf(_T("\r\n%s, %s, %d, %d"), szDate, szCurrentDate, nMaxDays, pMF->m_nInsnumberExam);

		if(nMaxDays < pMF->m_nInsnumberExam)
		{	CString szMsg;
			szMsg.Format(_T("\x42\x1EC7nh nh\xE2n kh\xE1m [%s]. \x43h\x1B0\x61 \x111\x1EBFn ng\xE0y \x42H quy \x111\x1ECBnh t\xE1i kh\xE1m"), szDate);
			
			if(ShowMessageBox(szMsg, MB_YESNO|MB_ICONWARNING)== IDNO)
			return -1;
			
		}
	}

	SetMode(VM_ADDDOC);
	if(!m_szCardNo.IsEmpty())
	{
		m_nDisrate = m_sCardInfo.discount;
	}
	OnCardNoButtonSelect();
	return 0;
}

int CHMSRegistration::OnAddNewReception(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd(); 
	CString szTitle, szMsg,tmpStr;
	CRecord rs(&pMF->m_db);
	CString szSQL;
	int nMode;	

	if((GetMode()==VM_ADD) || (GetMode()==VM_EDIT) ) 
 		return -1; 
	if(m_nPatientNo <= 0)
	{
		return -1;
	}
	// Kiem tra ho so co dang dieu tri ngoai tru khong. Neu dang dieu tri ngoai tru, khong cho tao ho so moi.
	szSQL.Format(_T("SELECT count(*) FROM hms_outpatient WHERE hop_docno=%ld AND hop_status ='O' "), pMF->m_nDocumentNo);
	rs.ExecSQL(szSQL);
	if(rs.GetIntValue() > 0)
	{
		if(ShowMessageBox(_T("\x42\x1EC7nh nh\xE2n \x111\x61ng \x111i\x1EC1u tr\x1ECB ngo\x1EA1i tr\xFA\r\n\x42\x1EA1n \x63\xF3 mu\x1ED1n k\x1EBFt th\xFA\x63 \x111\x1EE3t \x111i\x1EC1u tr\x1ECB ngo\x1EA1i tr\xFA \x63\x169, v\xE0 t\x1EA1o phi\x1EBFu kh\xE1m m\x1EDBi kh\xF4ng?"), MB_YESNO|MB_ICONWARNING)==IDYES)
		{
			szSQL.Format(_T("UPDATE hms_outpatient SET hop_status = 'T', hop_note='%s' WHERE hop_docno =%ld "), pMF->GetCurrentUser(), pMF->m_nDocumentNo);	
			pMF->ExecSQL(szSQL);
		}
		else
		return -1;
	}

	// Kiem tra benh nhan co dang dieu tri noi tru khong. (True, False)  benh nhan dang dieu tri 
	if (pMF->IsTreatmentTerminate(m_nPatientNo)==true)	{
		TranslateString(_T("This document is treatment [%s]. Unable to create new document"), tmpStr);
		szMsg.Format(tmpStr, pMF->m_szDeptName);		
		ShowMessageBox(szMsg, MB_OK|MB_ICONWARNING);
		return -1;
	}
	//Kiem tra neu trang thai ho so chua ket thuc thi tao ho so moi
	
	
	if(m_szDocStatus == _T("T"))
	{
		nMode = GetMode();
		
		OnAddNewDocument();
	}
	else
	{
		szSQL.Format(_T("SELECT hms_doc_terminate(%ld) "), m_nDocumentNo);
		pMF->ExecSQL(szSQL);		

		nMode = VM_ADDEXAM;
		szTitle = _T("Add New Examination Sheet");
	}
 	SetMode(nMode);
	return 0; 
}

int CHMSRegistration::OnHMSRegistrationListLoadData(){
	return 0;
}

int	CHMSRegistration::ParseCard(CString szObjectID, CString szCardNo, CString szCondition, int &nDiscount, CString& szCode){
	CMainFrame *pMF = (CMainFrame *)AfxGetMainWnd(); 
	CRecord rs(&pMF->m_db);
	CString szSQL;
	nDiscount = 0;
	szCode.Empty();
	if(szCardNo.GetLength() != szCondition.GetLength() || szCondition.GetLength() == 0)
		return -1;
	for (int i = 0; i < szCardNo.GetLength(); i++){
		if(szCondition[i] == _T('C'))
			szCode += szCardNo[i];
	}
	szCode.MakeUpper();
	if(szCode.IsEmpty())
		return -1;
	szSQL.Format(_T("SELECT * FROM hms_objectline WHERE hol_id='%s' AND hol_code='%s' "), szObjectID, szCode);
	rs.ExecSQL(szSQL);
	if(rs.IsEOF())
	{
		szCode.Empty();
		return -1;
	}
	rs.GetValue(_T("hol_discount"), nDiscount);
	return 1;
}


void CHMSRegistration::LoadFromExamSheet(long nPatientNo, int nReceptIdx){
	m_nPatientNo = nPatientNo;
	m_nReceptIdx = nReceptIdx;
	UpdateData(false);
	GetDataToScreen();
}

bool CHMSRegistration::AddExaminationReceipt(){
	return true;
}
void CHMSRegistration::PrintReceipt(bool bPreview){
	CMainFrame *pMF = (CMainFrame *)AfxGetMainWnd(); 
	static CReport rpt;
	CString szSQL, tmpStr;
	CRecord rs(&pMF->m_db);
	

	if(!rpt.Init(_T("Reports/HMS/HR_EXAMINATIONSHEET.RPT")) )
		return;
	szSQL.Format(_T(" SELECT 	hd_patientno as patientno,  ") \
		_T(" 	hd_docno as docno,") \
		_T(" 	trim(hp_surname||' '||hp_midname||' '||hp_firstname) as pname,") \
		_T(" 	hp_birthdate as birthdate,") \
		_T(" 	hms_getage(date(hd_admitdate), hp_birthdate) as age,") \
		_T(" 	hp_sex as sexid,") \
		_T(" 	sys_sel_getname('sys_sex', hp_sex) as sex,") \
		_T(" 	hp_occupation as occupationid,") \
		_T(" 	sys_sel_getname('sys_occupation', cast(hp_occupation as text)) as occupation,") \
		_T(" 	hp_dtladdr as detailaddress,") \
		_T("	hms_getaddress(hp_provid, hp_distid, hp_villid) AS address, ") \
		_T(" 	hp_workplaceid as workplaceid,") \
		_T(" 	hp_workplace as workplace,") \
		_T(" 	hd_object as objectid,") \
		_T(" 	(SELECT ho_desc FROM hms_object WHERE ho_id=hd_object) as objectname,") \
		_T("	hd_telephone as telephone, ") \
		_T(" 	hd_cardno as cardno,") \
		_T(" 	hd_cardidx as cardidx,") \
		_T(" 	hc_regdate as regdate,") \
		_T("	he_createdby ,he_updatedby, ") \
		_T(" 	hc_expdate as expdate,") \
		_T(" 	(SELECT hfl_name FROM hms_feelist WHERE hfl_feeid=he_examtype) as examtype,") \
		_T(" 	hrl_name as roomname, ") \
		_T(" 	hrl_section as section, ") \
		_T(" 	hrl_roomid as room, ") \
		_T("	he_roomid as roomid, ") \
		_T("	he_receptno as receptno, ") \
		_T("	he_examdate as examdate, ") \
		_T("	hfe_unitprice as amount, ") \
		_T("	hd_transplace as transplace, ") \
		_T("	hd_transdiagn as transdiagn, ")
		_T("	hd_xobject as xobject, ") \
		_T("	hd_xcardno as xcardno, ") \
		_T("	hd_telephone as telephone, ") \
		_T("	hd_xissuedate as xissuedate ") \
		_T(" FROM hms_patient") \
		_T(" LEFT JOIN hms_doc ON(hd_patientno=hp_patientno)") \
		_T(" LEFT JOIN hms_card ON(hc_patientno=hd_patientno and hc_cardno=hd_cardno and hc_idx=hd_cardidx) ") \
		_T(" LEFT JOIN hms_exam ON(he_docno=hd_docno)") \
		_T(" LEFT JOIN hms_roomlist ON (hrl_deptid=he_deptid AND hrl_id=he_roomid) ") \
		_T(" WHERE trim(he_deptid)='%s' AND he_docno=%ld AND he_receptidx=%d"), pMF->m_szDept, m_nDocumentNo, m_nReceptIdx);
//_fmsg(_T("%s"), szSQL);
	int ret = rs.ExecSQL(szSQL);
	if(rs.IsEOF())
		return;
	
	//Report Header
	rpt.GetReportHeader()->SetValue(_T("HEALTHSERVICE"), pMF->m_CompanyInfo.sc_pname);
	rpt.GetReportHeader()->SetValue(_T("HOSPITALNAME"), pMF->m_CompanyInfo.sc_name);
	
	rpt.GetReportHeader()->SetValue(_T("CompanyAddress"), pMF->m_CompanyInfo.sc_address);
	rpt.GetReportHeader()->SetValue(_T("CompanyPhone"), pMF->m_CompanyInfo.sc_phone);

	pMF->m_szLogoFileName.Format(_T("%s\\Reports\\HMS\\%s"), pMF->m_szGetCurrentDirectoryPath, _T("logo_header.jpg"));
	CReportItem *img_header = rpt.GetReportHeader()->GetItem(_T("logo_header"));
	if(img_header)
	{		
		HBITMAP hBitmap = pMF->GetPACSImage(pMF->m_szLogoFileName);
		if (hBitmap)
		{			
			img_header->SetHBITMAP(hBitmap);
			img_header->SetFixedHeight(false);
			::DeleteObject(hBitmap);
		}
	}


	tmpStr = pMF->GetSysDateTime();
	CString printDate;
	printDate.Format(rpt.GetReportHeader()->GetValue(_T("PrintDate")),tmpStr.Mid(11, 5), tmpStr.Mid(8, 2), tmpStr.Mid(5, 2), tmpStr.Left(4));
	rpt.GetReportHeader()->SetValue(_T("PrintDate"), printDate);
	rpt.GetReportHeader()->SetValue(_T("PatientNo"), rs.GetValue(_T("patientno")));
	rpt.GetReportHeader()->SetValue(_T("DocumentNo"), rs.GetValue(_T("docno")));
	rpt.GetReportHeader()->SetValue(_T("Barcode"), rs.GetValue(_T("docno")));
	StringUpper(rs.GetValue(_T("pname")), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("PatientName"), tmpStr);
	tmpStr.Empty();
	rpt.GetReportHeader()->SetValue(_T("Age"), rs.GetValue(_T("age")));
	
	rs.GetValue(_T("birthdate"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("YearOfBirth"), CDate::Convert(tmpStr, yyyymmdd, ddmmyyyy));

	rpt.GetReportHeader()->SetValue(_T("Sex"), rs.GetValue(_T("sex")));
	rpt.GetReportHeader()->SetValue(_T("Occupation"), rs.GetValue(_T("occupation")));
	//tmpStr.Format(_T("%s - %s - %s"), rs.GetValue(_T("village")), rs.GetValue(_T("district")), rs.GetValue(_T("provill")));
	
	rs.GetValue(_T("detailaddress"), tmpStr);
	if(!tmpStr.IsEmpty())
	{
		tmpStr.Format(_T("%s, %s"), rs.GetValue(_T("detailaddress")), rs.GetValue(_T("Address")));
	}

	rpt.GetReportHeader()->SetValue(_T("Address"), tmpStr);
	
	rs.GetValue(_T("detailaddress"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("DetailAddress"), tmpStr);
	
	tmpStr.Empty();
	rpt.GetReportHeader()->SetValue(_T("WorkPlace"), rs.GetValue(_T("workplace")));
	rpt.GetReportHeader()->SetValue(_T("ExamRoom"), rs.GetValue(_T("roomname")));
	rpt.GetReportHeader()->SetValue(_T("section"), rs.GetValue(_T("section")));
	rpt.GetReportHeader()->SetValue(_T("Roomid"), rs.GetValue(_T("roomid")));
	rpt.GetReportHeader()->SetValue(_T("Room"), rs.GetValue(_T("room")));
	rpt.GetReportHeader()->SetValue(_T("ExamDate"), CDateTime::Convert(rs.GetValue(_T("examdate")), yyyymmdd|hhmm, ddmmyyyy|hhmm));

	int nReceptNo=0;
	rs.GetValue(_T("receptno"), nReceptNo);
	rpt.GetReportHeader()->SetValue(_T("SheetNo"), rs.GetValue(_T("receptno")));
	tmpStr.Format(_T("%s.%0.2d"),rs.GetValue(_T("roomid")),nReceptNo);
	rpt.GetReportHeader()->SetValue(_T("SheetNoP"), tmpStr);	
	rpt.GetReportHeader()->SetValue(_T("ExamType"), rs.GetValue(_T("examtype")));
	//_msg(_T("%s"), rs.GetValue(_T("he_createdby")));
	rpt.GetReportHeader()->SetValue(_T("createdby"), pMF->GetDoctorName(rs.GetValue(_T("he_createdby"))));
	rpt.GetReportHeader()->SetValue(_T("updatedby"), rs.GetValue(_T("he_updatedby")));		
	
	rpt.GetReportHeader()->SetValue(_T("telephone"), rs.GetValue(_T("telephone")));

	rpt.GetReportHeader()->SetValue(_T("Money"), rs.GetValue(_T("amount")));
	rpt.GetReportHeader()->SetValue(_T("ObjectName"), rs.GetValue(_T("objectname")));
	rs.GetValue(_T("cardno"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("CardNo"), tmpStr);
	rs.GetValue(_T("xobject"), tmpStr);
	if(pMF->m_szPrintHemaReceipt == _T("Y") && tmpStr == _T("H")){
		rpt.GetReportHeader()->SetValue(_T("Hema"), _T("HEMA"));
	}
	rpt.GetReportHeader()->SetValue(_T("RegDate"), CDate::Convert(rs.GetValue(_T("regdate"))));
	rpt.GetReportHeader()->SetValue(_T("ExpDate"), CDate::Convert(rs.GetValue(_T("expdate"))));
	rpt.GetReportHeader()->SetValue(_T("TransferHospital"), rs.GetValue(_T("transplace")));
	rpt.GetReportHeader()->SetValue(_T("TransferDiagnosis"), rs.GetValue(_T("transdiagn")));
	tmpStr.Empty();
	rpt.GetReportHeader()->SetValue(_T("Relason"), tmpStr);
	
	rs.GetValue(_T("xcardno"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("xcardno"), tmpStr);	
	rs.GetValue(_T("xissuedate"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("xissuedate"), CDate::Convert(tmpStr));	
	
	rs.GetValue(_T("telephone"), tmpStr);
	rpt.GetGroupHeader()->SetValue(_T("phone"), tmpStr);


	szSQL.Format(_T("SELECT * FROM hms_khamsan WHERE hek_sohoso = %ld AND hek_sophieukham = %ld"), m_nDocumentNo, m_nReceptIdx);
	rs.ExecSQL(szSQL);
	if(!rs.IsEOF())
	{
		rs.GetValue(_T("hek_para"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_para"), tmpStr);
		rs.GetValue(_T("hek_kehoach"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_kehoach"), tmpStr);
		rs.GetValue(_T("hek_tc"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_tc"), tmpStr);
		rs.GetValue(_T("hek_kycuoi"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_kycuoi"), tmpStr);
		rs.GetValue(_T("hek_ckk"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_ckk"), tmpStr);	
		rs.GetValue(_T("hek_lydokham"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_lydokham"), tmpStr);		
		rs.GetValue(_T("hek_lankham"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_lankham"), tmpStr);
		rs.GetValue(_T("hek_sodatlich"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("hek_sodatlich"), tmpStr);
	}

	//rpt.SavePDF(_T("d:\test.pdf"));
	if(bPreview)
		rpt.PrintPreview();
	else
		rpt.Print();;

}

void CHMSRegistration::PrintAdmission(){
	CMainFrame *pMF = (CMainFrame *)AfxGetMainWnd(); 
	static CReport rpt;
	CString szSQL, tmpStr;
	CRecord rs(&pMF->m_db);
	

	if(!rpt.Init(_T("Reports/HMS/HR_ADMISSIONSHEET.RPT")) )
		return;
	szSQL.Format(_T(" SELECT 	hd_patientno as patientno,  ") \
		_T(" 	hd_docno as docno,") \
		_T(" 	trim(hp_surname||' '||hp_midname||' '||hp_firstname) as pname,") \
		_T(" 	hp_birthdate as birthdate,") \
		_T(" 	hms_getage(date(hd_admitdate), hp_birthdate) as age,") \
		_T(" 	date_part('year', hp_birthdate) as yearofbirth,") \
		_T(" 	hp_sex as sexid,") \
		_T(" 	sys_sel_getname('sys_sex', hp_sex) as sex,") \
		_T("	hd_telephone as phone, ") \
		_T(" 	hp_occupation as occupationid,") \
		_T(" 	sys_sel_getname('sys_occupation', cast(hp_occupation as text)) as occupation,") \
		_T(" 	hp_dtladdr as detailaddress,") \
		_T("	hms_getaddress(hp_provid, hp_distid, hp_villid) AS address, ") \
		_T(" 	hp_workplaceid as workplaceid,") \
		_T(" 	hp_workplace as workplace,") \
		_T(" 	hd_object as objectid,") \
		_T("	hd_insline as insline, ") \
		_T("	hd_emergency as emergency, ") \
		_T(" 	(SELECT ho_desc FROM hms_object WHERE ho_id=hd_object) as objectname,") \
		_T(" 	hd_cardno as cardno,") \
		_T(" 	hd_cardidx as cardidx,") \
		_T(" 	hc_regdate as regdate,") \
		_T(" 	hc_regcode as regcode,") \
		_T("	he_createdby,he_updatedby, ") \
		_T(" 	hc_expdate as expdate,") \
		_T(" 	(SELECT hfl_name FROM hms_feelist WHERE hfl_feeid=he_examtype) as examtype,") \
		_T(" 	(SELECT hrl_name FROM hms_roomlist WHERE hrl_deptid=he_deptid AND hrl_id=he_roomid) as roomname, ") \
		_T("	he_roomid as roomid, ") \
		_T("	he_receptno as receptno, ") \
		_T("	hfe_unitprice as amount, ") \
		_T("	hd_transplace as transplace, ") \
		_T("	hd_transdiagn as transdiagn, ")
		_T("	hd_xobject as xobject, ") \
		_T("	hd_xcardno as xcardno, ") \
		_T("	hd_xissuedate as xissuedate ") \
		_T(" FROM hms_patient") \
		_T(" LEFT JOIN hms_doc ON(hd_patientno=hp_patientno)") \
		_T(" LEFT JOIN hms_card ON(hc_patientno=hd_patientno and hc_cardno=hd_cardno and hc_idx=hd_cardidx) ") \
		_T(" LEFT JOIN hms_exam ON(he_docno=hd_docno)") \
		_T(" WHERE trim(he_deptid)='%s' AND he_docno=%ld AND he_receptidx=%d"), pMF->m_szDept, m_nDocumentNo, m_nReceptIdx);
//_fmsg(_T("%s"), szSQL);
	int ret = rs.ExecSQL(szSQL);
	if(rs.IsEOF())
		return;
	
	//Report Header
	rpt.GetReportHeader()->SetValue(_T("HEALTHSERVICE"), pMF->m_CompanyInfo.sc_pname);
	rpt.GetReportHeader()->SetValue(_T("HOSPITALNAME"), pMF->m_CompanyInfo.sc_name);
	tmpStr = pMF->GetSysDateTime();
	CString printDate;
	printDate.Format(rpt.GetReportHeader()->GetValue(_T("PrintDate")),tmpStr.Mid(11, 5), tmpStr.Mid(8, 2), tmpStr.Mid(5, 2), tmpStr.Left(4));
	rpt.GetReportHeader()->SetValue(_T("PrintDate"), printDate);
	rpt.GetReportHeader()->SetValue(_T("PatientNo"), rs.GetValue(_T("patientno")));
	rpt.GetReportHeader()->SetValue(_T("DocumentNo"), rs.GetValue(_T("docno")));
	rpt.GetReportHeader()->SetValue(_T("Barcode"), rs.GetValue(_T("docno")));
	StringUpper(rs.GetValue(_T("pname")), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("PatientName"), tmpStr);
	tmpStr.Empty();
	
	rpt.GetReportHeader()->SetValue(_T("yearofbirth"), rs.GetValue(_T("yearofbirth")));
	rpt.GetReportHeader()->SetValue(_T("Age"), rs.GetValue(_T("age")));
	rpt.GetReportHeader()->SetValue(_T("Sex"), rs.GetValue(_T("sex")));
	rpt.GetReportHeader()->SetValue(_T("Phone"), rs.GetValue(_T("phone")));
	rpt.GetReportHeader()->SetValue(_T("Occupation"), rs.GetValue(_T("occupation")));
	
	rs.GetValue(_T("detailaddress"), tmpStr);
	if(!tmpStr.IsEmpty())
	{
		tmpStr.Format(_T("%s, %s"), rs.GetValue(_T("detailaddress")), rs.GetValue(_T("Address")));
	}

	rpt.GetReportHeader()->SetValue(_T("Address"), tmpStr);
	
	rs.GetValue(_T("detailaddress"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("DetailAddress"), tmpStr);
	rs.GetValue(_T("detailaddress"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("DetailAddress"), tmpStr);
	tmpStr.Empty();
	rpt.GetReportHeader()->SetValue(_T("WorkPlace"), rs.GetValue(_T("workplace")));
	rpt.GetReportHeader()->SetValue(_T("ExamRoom"), rs.GetValue(_T("roomname")));
	rpt.GetReportHeader()->SetValue(_T("Roomid"), rs.GetValue(_T("roomid")));

	rs.GetValue(_T("insline"), tmpStr);
	if(!rs.GetValue(_T("cardno")).IsEmpty())
	{
		if(tmpStr != _T("Y")){
			rpt.GetReportHeader()->SetValue(_T("insline"), _T("X"));
			rpt.GetReportHeader()->SetValue(_T("offinsline"), _T(""));
		}
		else
		{
			rpt.GetReportHeader()->SetValue(_T("insline"), _T(""));
			rpt.GetReportHeader()->SetValue(_T("offinsline"), _T("X"));
		}
	}
	else
	{
		rpt.GetReportHeader()->SetValue(_T("insline"), _T(""));
			rpt.GetReportHeader()->SetValue(_T("offinsline"), _T(""));
	}

	rs.GetValue(_T("emergency"), tmpStr);
	if(tmpStr == _T("Y")){
		rpt.GetReportHeader()->SetValue(_T("Emergency"), _T("X"));		
	}
	else
	{
		rpt.GetReportHeader()->SetValue(_T("Emergency"), _T(""));		
	}

	int nReceptNo=0;
	rs.GetValue(_T("receptno"), nReceptNo);
	rpt.GetReportHeader()->SetValue(_T("SheetNo"), rs.GetValue(_T("receptno")));
	tmpStr.Format(_T("%s.%0.2d"),rs.GetValue(_T("roomid")),nReceptNo);
	rpt.GetReportHeader()->SetValue(_T("SheetNoP"), tmpStr);	
	rpt.GetReportHeader()->SetValue(_T("ExamType"), rs.GetValue(_T("examtype")));
	rs.GetValue(_T("he_createdby"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("createdby"), pMF->GetDoctorName(tmpStr));
	rpt.GetReportHeader()->SetValue(_T("updatedby"), rs.GetValue(_T("he_updatedby")));	

	rpt.GetReportHeader()->SetValue(_T("Money"), rs.GetValue(_T("amount")));
	rpt.GetReportHeader()->SetValue(_T("ObjectName"), rs.GetValue(_T("objectname")));
	rs.GetValue(_T("cardno"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("CardNo"), tmpStr);
	rs.GetValue(_T("xobject"), tmpStr);
	if(pMF->m_szPrintHemaReceipt == _T("Y") && tmpStr == _T("H")){
		rpt.GetReportHeader()->SetValue(_T("Hema"), _T("HEMA"));
	}
	rpt.GetReportHeader()->SetValue(_T("RegDate"), CDate::Convert(rs.GetValue(_T("regdate"))));
	rpt.GetReportHeader()->SetValue(_T("ExpDate"), CDate::Convert(rs.GetValue(_T("expdate"))));
	rpt.GetReportHeader()->SetValue(_T("TransferHospital"), rs.GetValue(_T("transplace")));
	rpt.GetReportHeader()->SetValue(_T("TransferDiagnosis"), rs.GetValue(_T("transdiagn")));
	tmpStr.Empty();
	rpt.GetReportHeader()->SetValue(_T("Relason"), tmpStr);
	
	rs.GetValue(_T("xcardno"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("xcardno"), tmpStr);	
	rs.GetValue(_T("xissuedate"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("xissuedate"), CDate::Convert(tmpStr));

	tmpStr.Empty();
	rs.GetValue(_T("regcode"), tmpStr);
	rpt.GetReportHeader()->SetValue(_T("RegCode"), tmpStr);
	if(!tmpStr.IsEmpty()){
		szSQL.Format(_T("SELECT hh_name FROM hms_hospital WHERE hh_code ='%s' LIMIT 1 "), tmpStr);
		rs.ExecSQL(szSQL);
		rs.GetValue(_T("hh_name"), tmpStr);
		rpt.GetReportHeader()->SetValue(_T("RegName"), tmpStr);
	}
	
	

	rpt.PrintPreview();;

}

CString CHMSRegistration::ConvertHexStrToUnicode(CString szInput){	
	
	CString szOutput;
	CString szText;
	
	int code_page = CP_UTF8;
	
	szOutput.Trim();

	szText.Empty();
	std::string str;
	std::wstring wstr;
	for (int j = 0; j < szInput.GetLength(); j += 2)
	{
		CString hex = szInput.Mid(j, 2);
		if(hex == _T("00"))
		{
			hex = szInput.Mid(j, 4);
			j+= 2;
			code_page = CP_ACP;
			std::wstringstream iss((LPCTSTR)hex);
			int temp;
			iss >> std::hex >> temp;
			wstr += static_cast<wchar_t>(temp);
		}
		else
		{
			std::wstringstream iss((LPCTSTR)hex);
			int temp;
			iss >> std::hex >> temp;
			str += static_cast<char>(temp);
			_tprintf(_T("\r\n%X"), temp);
		}
		
		
	}
	if(code_page == CP_UTF8)
	{
		WCHAR szBuffer[254];
		memset(szBuffer, _T('\0'), 254);
		::MultiByteToWideChar(code_page, 0, str.c_str(), str.length(), szBuffer, str.length());
		szOutput = szBuffer;
	}
	

	return szOutput;
}

void CHMSRegistration::OnCardProcessingBarcode(CString szCardInfo){

}

BEGIN_MESSAGE_MAP(CHMSRegistration, CGuiView)
	
END_MESSAGE_MAP()
void CHMSRegistration::OnFunctionalTest()
{
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	if(GetMode() != VM_VIEW)
		return;

	if(!pMF->CheckPermission(_T("01.06")))
	{
		ShowMessageBox(_T("Permission Denined."), 0);
		return;
	}

	if(pMF->m_nDocumentNo < 0 || pMF->m_nRefIndex <= 0)
		return;

	CHMSFunctionalTestDialog dlg(this);
	dlg.DoModal();
}


#include "HMSKhamsanPK.h"
void CHMSRegistration::OnKhamsankhoa(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	if(GetMode() != VM_VIEW)
		return;

	
	if(m_nDocumentNo <= 0)
		return;

	CHMSKhamsanPK dlg(this);
	dlg.m_nPatientNo = m_nPatientNo;
	dlg.m_nDocumentNo = m_nDocumentNo;
	dlg.m_nReceptIdx = m_nReceptIdx;
	dlg.DoModal();
}


int CHMSRegistration::OnAddAdditionalCard(){
	if(m_szCardNo.Find(_T("HN")) != -1)
	{
		CHMSAdditionCardDialog dlg(this);
		dlg.SetMode(VM_EDIT);
		dlg.DoModal();		
	}
	return 0;
}

int CHMSRegistration::OnIgnoreTransferredInfo(){
	m_wndHospital.SetCheckValue(false);
	m_wndDisease.SetCheckValue(false);
	m_bValidHospitalTransfer = false;
	return 0;
}
BOOL CHMSRegistration::PreTranslateMessage(MSG *pMsg)
{
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	//_tprintf(_T("%d"), pMsg->message);

	if (pMsg->message == WM_KEYDOWN)
	{
		if (GetKeyState(VK_CONTROL) < 0 && pMsg->wParam == _T('N'))
		{	if(OnAddNewDocument() <=0)
				OnAddHMSRegistration();
		}
		else
		if (GetKeyState(VK_CONTROL) < 0 && pMsg->wParam == _T('S'))
		{
			OnSaveSelect();
		}
		else
		if (GetKeyState(VK_CONTROL) < 0 && pMsg->wParam == _T('T'))
		{
			OnCancelHMSRegistration();
		}
		else
		if (GetKeyState(VK_CONTROL) < 0 && pMsg->wParam == _T('F'))
		{			
			m_wndDocumentNo.SetFocus();
			m_wndDocumentNo.SetSel(0, -1);
		}
		
		UINT ctrlId = ::GetDlgCtrlID(pMsg->hwnd);

		if (ctrlId == m_wndWorkingPlace.GetDlgCtrlID())
		{
		}
	}
	return CGuiView::PreTranslateMessage(pMsg);
}


void CHMSRegistration::OnKhamsuckhoe()
{
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	if (pMF->m_nDocumentNo > 0)
	{
		PrintAdmission();		
	}
}

// Kiem tra neu benh nhan co the BH kham trong ngay bao nhieu lan
int CHMSRegistration::OnCheckNumberExamToday(){
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL,szMsg;
	int nRow =0;
	szSQL.Format(_T("SELECT COUNT(*) FROM hms_doc WHERE upper(hd_cardno)=upper('%s') AND hd_patientno=%ld AND DATE(hd_admitdate) = DATE(current_date) "), m_szCardNo, m_nPatientNo);
	rs.ExecSQL(szSQL);
	nRow = rs.GetIntValue();

	return nRow;
}
bool CHMSRegistration::IsCheckCardInfo()
{
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	UpdateData(true);
	//_msg(_T("%s"),m_szBirthDate);
	if(!pMF->bIsAutoCheckCard)
		return false ;
	
	if(pMF->m_szInsuranceWebService != _T("Y"))
		return false;
	if(m_szCardNo.IsEmpty())
		return false;
	
	if(m_szPatientName.IsEmpty())
		return false;

	if(m_szBirthDate.IsEmpty()|| m_szBirthDate==_T("1752/09/14"))
		return false;

	if(m_szSexKey.IsEmpty())
		return false;

	return true;

}
void CHMSRegistration::OnTimer(UINT nIDEvent)
{
	// TODO: Add your message handler code here and/or call default
	if (nIDEvent == 1)
	{
		if(IsCheckCardInfo())
		{
					
		}
		KillTimer(1);
	}
	CGuiView::OnTimer(nIDEvent);
}

int CHMSRegistration::GetInsLine(CString szRegCode)
{
	CMainFrame *pMF = (CMainFrame *) AfxGetMainWnd();
	UpdateData(true);
	CRecord rsC(&pMF->m_db);
	CString szCheckCard;
	int nInsLine = 0;
	szCheckCard.Format(_T(" select CASE WHEN '%s' IN(%s) THEN 1 else 0 end as line ") 
			,szRegCode ,m_szInsLine);
	rsC.ExecSQL(szCheckCard);
	rsC.GetValue(_T("line"), nInsLine);
	return nInsLine;

}

bool CHMSRegistration::GetCardInfor(CString szCardID, CString szPatientName, CString szSex, CString szBirthDate, CString& szCardNo, CString& szPatientName1, CString& szSex1, CString& szBirthDate1)
{	
	CMainFrame *pMF = (CMainFrame *)AfxGetMainWnd(); 
	CString szJsonData, szError;
	CString szParams, szSQL;
	CRecord rs(&pMF->m_db);
	bool bIsEditMode = GetMode() == VM_ADD || GetMode() == VM_EDIT;
	bool bFound = false;
	
	// For checking
	CString tmpSName, tmpSSex, tmpSBirthday, tmpSDkbd, tmpSgtTheTu, tmpSgtTheDen;
	CString tmpError, szRegCodeKey, szToDate, szFromDate;
	StringUpper(m_szPatientName, tmpSName);
	tmpSBirthday = CDate::Convert(m_szBirthDate,yyyymmdd,ddmmyyyy );


	tmpSSex = m_szSexKey.Compare(_T("M")) == 0 ? _T("NAM") : _T("NỮ");
	
	tmpError.Empty();
	
	if( szCardID.Trim().IsEmpty() ||  szPatientName.Trim().IsEmpty() || szBirthDate.Trim().IsEmpty() ) 
	{
		MessageBox(_T("Thiếu/lỗi thông tin tra cứu thẻ\n(Kiểm tra: Họ tên, ngày sinh, mã thẻ)"), _T("Cổng tiếp nhận BHXH"), MB_ICONERROR);
		return false;
	}

	//AfxMessageBox( tmpSName + _T("\n") + tmpSBirthday + _T("\n") + tmpSSex + _T("\n") + tmpSDkbd );

	JSONVALUE jsonRequest;	
	jsonRequest["username"] = pMF->m_szUserNameBH;
	jsonRequest["password"] = pMF->m_szPasswordBH;

	std::wstring json_string;
	jsonRequest.ToString(json_string);
	szJsonData.Format(_T("%s"), json_string.c_str());
	
	
	if(pMF->m_szCheck_card_2024 == _T("Y"))
	{
		szJsonData.Format(_T("username=%s&password=%s"), pMF->m_szUserNameBH, pMF->m_szPasswordBH);
	}

	CInternetSession session(_T("VIMES_POST"));

	CHttpConnection* pServer = NULL;
	CHttpFile* pFile = NULL;
	CString szResponse, tmpStr;
	LPCSTR szURLLPCSTR;
	bool bCheck2The = false;

	CString szURL, szURL1;	
	DWORD dwLength;
	LPWSTR  szUrl2;
   szURL.Format(_T("https://egw.baohiemxahoi.gov.vn/api/token/take"));
    //_msg(_T("%s"), szURL);
	BOOL result = FALSE;
	try
	{
		CString strServerName;
		INTERNET_PORT nPort;
		DWORD dwRet = 0;			

		CString svr, strobj, strParams;
		DWORD svrtype;
		INTERNET_PORT port;

		CString strHeaders = _T("Content-Type: application/json; charset=utf-8");
		if(pMF->m_szCheck_card_2024 == _T("Y"))
			strHeaders = _T("Content-Type: application/x-www-form-urlencoded");


		::AfxParseURL(szURL, svrtype, svr, strobj, port);
		session.SetOption(INTERNET_OPTION_RECEIVE_TIMEOUT, 10000);
		pServer = session.GetHttpConnection(svr, port);
		 _tprintf(_T("\r\n%s -- %d"),svr,port);

		if(szURL.Left(5) == _T("https"))		
			pFile = pServer->OpenRequest(CHttpConnection::HTTP_VERB_POST,strobj,NULL,1,NULL,NULL,INTERNET_FLAG_EXISTING_CONNECT|INTERNET_FLAG_SECURE); 
		else
			pFile = pServer->OpenRequest(CHttpConnection::HTTP_VERB_POST,strobj,NULL,1,NULL,NULL,INTERNET_FLAG_EXISTING_CONNECT);

		pFile->AddRequestHeaders(strHeaders);

		char* buff;
		int len = ::WideCharToMultiByte(CP_UTF8, 0, szJsonData, szJsonData.GetLength(), NULL, 0, 0, 0);
		buff = new char[len+sizeof(char)];
		memset(buff, '\0', len+sizeof(char));
		::WideCharToMultiByte(CP_UTF8, 0, szJsonData, szJsonData.GetLength(), buff, len, 0, 0);
		printf("%s", buff);
		result = pFile->SendRequest(NULL, 0, (LPVOID)buff, (DWORD)strlen(buff));				
		delete buff;

		pFile->QueryInfoStatusCode(dwRet);

		_tprintf(_T("\r\n%d"), dwRet);
		if (dwRet == HTTP_STATUS_OK)
		{
			_tprintf(_T("\r\n%s"), _T("HTTP_STATUS_OK"));
	        char szBuff[1025];
			UINT dwLen = 0;
			std::string str;
			str.clear();

			for(;;)
			{
				memset(szBuff, '\0', 1025);
				dwLen = pFile->Read(szBuff, 1024);
				if(dwLen <= 0)
					break;
			    
				str += szBuff;			    
			}

			

			WCHAR* wcString = new WCHAR[str.length()+1];
			//memset(wcString, L'\0', str.length());			
			UINT nbyte = ::MultiByteToWideChar(CP_UTF8, 0, str.c_str(), str.length(), NULL, 0);
			::MultiByteToWideChar(CP_UTF8, 0, str.c_str(), str.length(), wcString, nbyte);			
			wcString[nbyte] = L'\0';
			tmpStr.Format(_T("%s"), wcString);
			szResponse += tmpStr;
			delete wcString;

			_tprintf(_T("\r\n%s"), szResponse);
			
			CString szData, tmpStr1;
			JSONVALUE j, js, jsonResponseToken, jResponse;	
			if(!szResponse.IsEmpty())
			{	
				jsonResponseToken.Parse(szResponse);
				
				JSONVALUE j = jsonResponseToken.At(_T("maKetQua"));
				JSONVALUE jj = jsonResponseToken.At(_T("APIKey"));
				JSONVALUE jValue;
				std::wstring strData;
				std::wstring json_string;		
				// Ma loi tra ve
				j.ToString(json_string);		
				szData.Format(_T("%s"), json_string.c_str());
				// APIKey tra ve
				jj.ToString(json_string);		
				szData.Format(_T("%s"), json_string.c_str());

				//_msg(_T("%s"),szData);

				jValue = jj["access_token"];
				jValue.ToString(strData);
				tmpStr = strData.c_str();
				tmpStr1.Format(_T("%c"), 34);
				tmpStr.Replace(tmpStr1, _T(""));
				m_szAccess_token = tmpStr;
				_tprintf(_T("\r\nm_szAccess_token:%s"), m_szAccess_token);

				jValue = jj["id_token"];
				jValue.ToString(strData);
				tmpStr = strData.c_str();
				tmpStr1.Format(_T("%c"), 34);
				tmpStr.Replace(tmpStr1, _T(""));
				m_szToken_ID = tmpStr;
				_tprintf(_T("\r\nm_szToken_ID:%s"), m_szToken_ID);				

				
				JSONVALUE jRCard_info;
				szJsonData.Empty();
				jRCard_info["maThe"] = szCardID;	
				jRCard_info["hoTen"] = szPatientName;
				szBirthDate =CDate::Convert( szBirthDate,yyyymmdd,ddmmyyyy);

				if(szBirthDate == _T("1752/09/14")){
					szBirthDate = _T("01/01/1980");
				}
				
				if(szBirthDate.GetLength() <= 0 || szBirthDate.IsEmpty())
				{
					szBirthDate = _T("01/01/1980");
				}
												
				jRCard_info["ngaySinh"] = szBirthDate.Right(4);

				std::wstring jStr;
				jRCard_info.ToString(jStr);
				szJsonData.Format(_T("%s"), jStr.c_str());
				
				CString szTenCB,szMaCCCDCB;
				if(pMF->m_szCheck_card_2024 == _T("Y"))
				{
					/*if(!pMF->m_UserInfo.su_cccd.IsEmpty())
						szMaCCCDCB = pMF->m_UserInfo.su_cccd;
					else
						szMaCCCDCB = pMF->m_szBH_User_CCCD;*/
					szMaCCCDCB = pMF->m_szBH_User_CCCD;

					/*if(!pMF->m_UserInfo.su_name_bhxh.IsEmpty())
						szTenCB = pMF->m_UserInfo.su_name_bhxh;
					else
						szTenCB =  pMF->m_szBH_User_Name;*/
					szTenCB =  pMF->m_szBH_User_Name;

					szJsonData.Format(_T("maThe=%s&hoTen=%s&ngaySinh=%s&hoTenCb=%s&cccdCb=%s"),
						szCardID, 
						m_szPatientName, 
						szBirthDate.Right(4), 
						szTenCB, 
						szMaCCCDCB);
				}
				
				_tprintf(_T("\r\n%s"), szJsonData);
				szURL.Format(_T("https://egw.baohiemxahoi.gov.vn/api/egw/KQNhanLichSuKCB2019?token=%s&id_token=%s&username=%s&password=%s"), m_szAccess_token, m_szToken_ID,
					pMF->m_szUserNameBH, pMF->m_szPasswordBH);
				if(pMF->m_szCheck_card_2024 == _T("Y"))
				{
					szURL.Format(_T("https://egw.baohiemxahoi.gov.vn/api/egw/KQNhanLichSuKCB2024?token=%s&id_token=%s&username=%s&password=%s"), m_szAccess_token, m_szToken_ID,
					pMF->m_szUserNameBH, pMF->m_szPasswordBH);
				}

				//_msg(_T("%s, %s"), szURL, szJsonData);

				::AfxParseURL(szURL, svrtype, svr, strobj, port);
				session.SetOption(INTERNET_OPTION_RECEIVE_TIMEOUT, 10000);
				pServer = session.GetHttpConnection(svr, port);
				_tprintf(_T("\r\n%s -- %d"),svr,port);
				pFile = pServer->OpenRequest(CHttpConnection::HTTP_VERB_POST,strobj,NULL,1,NULL,NULL,INTERNET_FLAG_SECURE); 
				pFile->AddRequestHeaders(strHeaders);

				char* buff;
				int len = ::WideCharToMultiByte(CP_UTF8, 0, szJsonData, szJsonData.GetLength(), NULL, 0, 0, 0);
				buff = new char[len+sizeof(char)];
				memset(buff, '\0', len+sizeof(char));
				::WideCharToMultiByte(CP_UTF8, 0, szJsonData, szJsonData.GetLength(), buff, len, 0, 0);
				printf("%s", buff);
				result = pFile->SendRequest(NULL, 0, (LPVOID)buff, (DWORD)strlen(buff));				
				delete buff;

				pFile->QueryInfoStatusCode(dwRet);

				_tprintf(_T("\r\n%d"), dwRet);
				if (dwRet == HTTP_STATUS_OK)
				{
					_tprintf(_T("\r\n%s"), _T("HTTP_STATUS_OK"));
					char szBuff[1025];
					UINT dwLen = 0;
					std::string str;
					str.clear();

					for(;;)
					{
						memset(szBuff, '\0', 1025);
						dwLen = pFile->Read(szBuff, 1024);
						if(dwLen <= 0)
							break;
					    
						str += szBuff;			    
					}
					
					szResponse.Empty();
					WCHAR* wcString = new WCHAR[str.length()+1];
					//memset(wcString, L'\0', str.length());
					UINT nbyte = ::MultiByteToWideChar(CP_UTF8, 0, str.c_str(), str.length(), NULL, 0);
					::MultiByteToWideChar(CP_UTF8, 0, str.c_str(), str.length(), wcString, nbyte);
					wcString[nbyte] = L'\0';
					tmpStr.Format(_T("%s"), wcString);
					szResponse += tmpStr;
					delete wcString;					
									
					if(!szResponse.IsEmpty())
					{
						jResponse.Parse(szResponse);
						//_msg(_T("%s"),szResponse);

						j= jResponse.At(_T("maKetQua"));
						j.ToString(json_string);
						CString szMaloi; 
						szMaloi.Format( _T("%s"), json_string.c_str() );						 
						szMaloi.Replace(_T("\""), _T(""));

						j= jResponse.At(_T("ghiChu"));
						j.ToString(json_string);
						tmpStr.Format(_T("%s"), json_string.c_str());						
						tmpStr.Replace(_T("\""), _T(""));
						//dlg.m_szNOI_DUNG=tmpStr;
						szData.Format(_T("N\x1ED9i \x64ung: %s"),tmpStr);
						CStringToken tk(tmpStr, _T("!"));
						if(tk.GetSize() > 0)
						{
							tk.GetAt(0,tmpStr);
							//dlg.m_szCanhbao=tmpStr;
						}						

						if (szMaloi.Compare(_T("000")) == 0 || szMaloi.Compare(_T("003")) == 0 || szMaloi.Compare(_T("004")) == 0) 
							// -- Thẻ còn giá trị sử dụng mới check
						{

							j= jResponse.At(_T("hoTen"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							//dlg.m_szHO_TEN=tmpStr;							
							szData.AppendFormat(_T("\r\n\ H\x1ECD t\xEAn: %s"),tmpStr);						
							// Check 
							StringUpper(tmpStr, tmpStr);							
							if (tmpSName.Compare(tmpStr) !=0 ) {							
								tmpError.AppendFormat( _T("Họ tên sai: %s -> %s\n"), tmpSName, tmpStr );								
							}							

							szPatientName1 = tmpStr;
							_tprintf(_T("\r\nHoTen:%s"), szPatientName1);

							j= jResponse.At(_T("ngayDu5Nam"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							CString szdateover5year;
							szdateover5year=tmpStr;
							szdateover5year.Replace(_T("/"),_T("-"));
							CString szFromDate;
							szFromDate = CDate::Convert(szdateover5year, ddmmyyyy, yyyymmdd);
							m_sCardInfo.sz5YearDate = szFromDate;
							if(CompareDate(szFromDate, pMF->GetSysDate()) <= 0 && !szFromDate.IsEmpty())
							{	
								m_sCardInfo.b5Years = true;
							}
												
							j= jResponse.At(_T("ngaySinh"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							//dlg.m_szNGAY_SINH=tmpStr;

							CString szBirthday;
							szBirthday=tmpStr;
							if(tmpStr.GetLength()==4)
							{								
								if (bIsEditMode)
								{
									m_szBirthDate =tmpStr + _T("/01/01");
									m_bYearofBirth=TRUE;
								}
							}
							else
							{	
								szBirthday.Replace(_T("/"),_T("-"));
								
								CDate dte;
								if(dte.ParseDate(szBirthday, ddmmyyyy))
								{		
									szBirthDate.Format(_T("%.2d/%.2d/%.4d"), dte.GetDay(), dte.GetMonth(), dte.GetYear());								
								}
								else
								{
									dte.ParseDate(szBirthday, yyyymmdd);
									szBirthDate.Format(_T("%.2d/%.2d/%.4d"), dte.GetDay(), dte.GetMonth(), dte.GetYear());
									
								}
								
								
								m_szBirthDate = CDate::Convert(szBirthDate,ddmmyyyy,yyyymmdd);
							}	

							szBirthDate1 = m_szBirthDate;

							szData.AppendFormat(_T("\r\n\ Ng\xE0y sinh: %s"),tmpStr);
							
							// Check 						
							//if (tmpSBirthday.Compare(tmpStr) !=0 ) {
							//	tmpError.AppendFormat( _T("Ngày sinh sai: %s -> %s\n"), tmpSBirthday, tmpStr );							
							//}

							j= jResponse.At(_T("gioiTinh"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							tmpStr.Trim();
							// Correct
							
							tmpStr == _T("Nam")?_T("M"):_T("F");
							szSex1 = tmpStr;

							szData.AppendFormat(_T("\r\n\ Gi\x1EDBi t\xEDnh: %s"),tmpStr);
							// Check 		
							StringUpper(tmpStr, tmpStr);
							//if (GetMode() != VM_ADD && tmpSSex.Compare(tmpStr) !=0 ) {
							//	tmpError.AppendFormat( _T("Giới tính sai: %s -> %s\n"), tmpSSex, tmpStr );														
							//}

							j= jResponse.At(_T("diaChi"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							tmpStr.Trim();
							//m_szCompany=tmpStr;
							//szAddress = tmpStr;
							//dlg.m_szDIA_CHI=tmpStr;
							szData.AppendFormat(_T("\r\n\ \x110\x1ECB\x61 \x63h\x1EC9: %s"),tmpStr);

							j= jResponse.At(_T("maDKBD"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							tmpStr.Trim();
							szRegCodeKey=tmpStr;
							//szCardRegCode= tmpStr;
							m_sCardInfo.regplacecde = tmpStr;
							//dlg.m_szMADKBD=tmpStr;
							szData.AppendFormat(_T("\r\n\ M\xE3 \x110K\x42\x110: %s"),tmpStr);

							// Correct

							j= jResponse.At(_T("maThe"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							//dlg.m_szTHE_CU=tmpStr;
						//	szData.AppendFormat(_T("\r\n\ M\xE3 th\x1EBB \x63\x169: %s"),tmpStr);
															
							szCardNo = tmpStr + szRegCodeKey;							
							_tprintf(_T("\r\nCardNo:%s"), szCardNo);
						
							j= jResponse.At(_T("gtTheTu"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							CString szregdate;
							szregdate=tmpStr;
							szregdate.Replace(_T("/"),_T("-"));
							// Correct
							//if (bIsEditMode)
							m_sCardInfo.regdate =CDate::Convert(szregdate, ddmmyyyy, yyyymmdd);
							//dlg.m_szTU_NGAY1=tmpStr;
							szData.AppendFormat(_T("\r\n\ T\x1EEB ng\xE0y: %s"),tmpStr);
							// Check
							//if (GetMode() != VM_ADD && tmpSgtTheTu.Compare(tmpStr) != 0) {
							//	tmpError.AppendFormat(_T("Hạn thẻ (từ) sai: %s -> %s\n"), tmpSgtTheTu, tmpStr);							
							//}

							j= jResponse.At(_T("gtTheDen"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							CString szexpdate;
							szexpdate=tmpStr;
							//dlg.m_szDEN_NGAY1=tmpStr;

							// Correct
						//	if (bIsEditMode)
							m_sCardInfo.expdate = CDate::Convert(szexpdate, ddmmyyyy, yyyymmdd);

							szData.AppendFormat(_T("\r\n\ \x110\x1EBFn ng\xE0y: %s"), tmpStr);
							// Check
						/*	if (GetMode() != VM_ADD && tmpSgtTheDen.Compare(tmpStr) != 0) {
								tmpError.AppendFormat(_T("Hạn thẻ (đến) sai: %s -> %s\n"), tmpSgtTheDen, tmpStr);							
							}*/

							j= jResponse.At(_T("maKV"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							m_sCardInfo.szArea = tmpStr;
							//dlg.m_szMA_KV=tmpStr;

							CString szarea;
						//	_msg(_T("%s"),tmpStr);
							if(tmpStr==_T("K1") || tmpStr==_T("K2") ||tmpStr==_T("K3"))
							{

								//m_szAreaKey=tmpStr;
							}else
							{
								//m_szAreaKey=_T("KXD");
							}

							szData.AppendFormat(_T("\r\n\ M\xE3 KV: %s"),tmpStr);

							j= jResponse.At(_T("maTheCu"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							//dlg.m_szTHE_CU=tmpStr;
							szData.AppendFormat(_T("\r\n\ M\xE3 th\x1EBB \x63\x169: %s"),tmpStr);

							if(CompareDate(szToDate, pMF->GetSysDate()) < 0)
							{
								bCheck2The = true;
							}
											
							j= jResponse.At(_T("maDKBDMoi"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));		
							//if (tmpStr != _T("null") && bCheck2The){
							szRegCodeKey = tmpStr;
							//}

							j= jResponse.At(_T("maTheMoi"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							//dlg.m_szTHE_MOI=tmpStr;
							szData.AppendFormat(_T("\r\n\ M\xE3 th\x1EBB m\x1EDBi: %s"),tmpStr);							
							if (tmpStr != _T("null") && (bCheck2The || m_szCardNo.GetLength()==10  )&& tmpStr.GetLength() > 10){								
								m_szCardNo = tmpStr + szRegCodeKey;
							}
							
							
							j= jResponse.At(_T("gtTheTuMoi"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							//dlg.m_szTU_NGAY2=tmpStr;
							szData.AppendFormat(_T("\r\n\ T\x1EEB ng\xE0y: %s"),tmpStr);
							if (tmpStr != _T("null") && bCheck2The)
							{
								szregdate=tmpStr;
								szregdate.Replace(_T("/"),_T("-"));
								szFromDate=CDate::Convert(szregdate, ddmmyyyy, yyyymmdd);
								m_sCardInfo.regdate = szFromDate;
							}

							j= jResponse.At(_T("gtTheDenMoi"));
							j.ToString(json_string);
							tmpStr.Format(_T("%s"), json_string.c_str());
							tmpStr1.Format(_T("%c"), 34);
							tmpStr.Replace(tmpStr1, _T(""));
							//dlg.m_szDEN_NGAY2=tmpStr;
							szData.AppendFormat(_T("\r\n\ \x110\x1EBFn ng\xE0y: %s"),tmpStr);
							if (tmpStr != _T("null") && bCheck2The)
							{
								szexpdate=tmpStr;
								szToDate=CDate::Convert(szexpdate, ddmmyyyy, yyyymmdd);
								m_sCardInfo.expdate = szToDate;
							}
					
							if (szCardNo.GetLength() > 10)
								bFound = true;
							_tprintf(_T("\r\nMaloi: %s| Mode: %d| The moi: %d"), szMaloi, GetMode(), bCheck2The);							
						
							UpdateData(false);							
						} 
						else // Mã lỗi != 000, thẻ không có giá trị sử dụng
						{						
							//dlg.m_szCanhbao= szData;																					
							MessageBox( szData, _T("Cổng tiếp nhận BHXH: "), MB_ICONERROR );
							//dlg.DoModal();
						}

						//m_wndSave.SetFocus();
					}
				}
			}

		}
		else
		{
			_tprintf(_T("Erro Get Topken"));			
		}	
	
		delete pFile;
		delete pServer;
	}
	catch (CInternetException* pEx)
	{
		//catch errors from WinInet
		TCHAR pszError[64];
		pEx->GetErrorMessage(pszError, 64);
		_tprintf(_T("%63s"), pszError);
		CString szMsg;
		MessageBox(_T("Không thể kết nối đến cổng tiếp nhận BHXH"), _T("Cổng tiếp nhận BHXH"), MB_ICONERROR);		
	}
	
	
	return bFound;
}

#include "HMSCaptureDialog.h"
int CHMSRegistration::OnCapturePatient(){
	
	if(m_nDocumentNo <= 0)
		return 0;

	CHMSCaptureDialog dlg(this);
	dlg.m_nDocumentNo = m_nDocumentNo;
	if(dlg.DoModal()== IDOK){
		m_wndPatientImg.SetFileName(dlg.m_szFileName);
		m_wndPatientImg.Invalidate();
	}
}

int CHMSRegistration::OnLoadPatientImg(long nDocno){
	CMainFrame *pMF = (CMainFrame*) AfxGetMainWnd();
	CRecord rs(&pMF->m_db);
	CString szSQL;
	m_wndPatientImg.SetFileName(_T(""));
	m_wndPatientImg.Invalidate();
	//Load anh benh nhan
	/*szSQL.Format(_T("SELECT hpf_name FROM hms_patient_files WHERE hpf_docno = %ld AND hpf_type ='RM' "), nDocno);
	rs.ExecSQL(szSQL);
	if(!rs.IsEOF())
	{		
		CString szFileName, szFileNameLocal,szPath;
		bool bCheckFile = false;
		rs.GetValue(_T("hpf_name"), szFileName);

		szFileNameLocal.Format(_T("%s\\data\\hms\\%s"), pMF->m_szPath,szFileName);
		bCheckFile = PathFileExists(szFileNameLocal);
		if(!bCheckFile)
		{
			bCheckFile = pMF->DownloadFile(szFileName, szFileNameLocal);
		}

		if(bCheckFile)
		{					
			m_wndPatientImg.SetFileName(szFileNameLocal);					
		}
		else
		{
			m_wndPatientImg.SetFileName(_T(""));					
		}
		m_wndPatientImg.Invalidate();
	}*/

	return 0;
}
#include "NationlityDialog.h"
int CHMSRegistration::OnNationalityCheckValue()
{
	UpdateData(TRUE);
	m_szNationality.Empty();
	m_szNationalityDesc.Empty();
	//if(m_bNationality)
	{
		CNationlityDialog dlg(this);
		if(dlg.DoModal() == IDOK)
		{
			m_szNationality = dlg.m_szNationalityKey;
			m_szNationalityDesc.Format(_T("Quốc tịch [%s]"), dlg.m_szNationalityDesc);
		}
	}
	m_wndNationality.SetWindowText(m_szNationalityDesc);
	return 0;
}

