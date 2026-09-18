[Setup]
AppName=VIMES Workstation Agent
AppVersion=1.2.0
DefaultDirName={autopf}\VIMES Workstation Agent
OutputDir=.
OutputBaseFilename=Vimes-Workstation-Agent-Setup
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
SetupIconFile=vimes.ico
CloseApplications=force

[Files]
Source: "..\publish\win-x64\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion
Source: "..\publish\win-x64\appsettings.json"; DestDir: "{commonappdata}\VIMES\WorkstationAgent"; Flags: ignoreversion uninsneveruninstall
Source: "..\..\vimes-extension\*"; DestDir: "{app}\Extension"; Flags: recursesubdirs ignoreversion

[Registry]
; Cho phép Microsoft Edge gọi Agent nội bộ từ VIMES HIS (bỏ qua Private Network Access / Insecure Origin block)
Root: HKLM; Subkey: "SOFTWARE\Policies\Microsoft\Edge\InsecureOriginsTreatedAsSecure"; ValueType: string; ValueName: "1"; ValueData: "http://113.160.202.198:8088"; Flags: uninsdeletekeyifempty
Root: HKLM; Subkey: "SOFTWARE\Policies\Microsoft\Edge\InsecureOriginsTreatedAsSecure"; ValueType: string; ValueName: "2"; ValueData: "http://localhost:5173"; Flags: uninsdeletekeyifempty
Root: HKLM; Subkey: "SOFTWARE\Policies\Microsoft\Edge\InsecurePrivateNetworkRequestsAllowedForUrls"; ValueType: string; ValueName: "1"; ValueData: "http://113.160.202.198:8088"; Flags: uninsdeletekeyifempty
Root: HKLM; Subkey: "SOFTWARE\Policies\Microsoft\Edge\InsecurePrivateNetworkRequestsAllowedForUrls"; ValueType: string; ValueName: "2"; ValueData: "http://localhost:5173"; Flags: uninsdeletekeyifempty
Root: HKLM; Subkey: "SOFTWARE\Policies\Microsoft\Edge\LocalNetworkAccessAllowedForUrls"; ValueType: string; ValueName: "1"; ValueData: "http://113.160.202.198:8088"; Flags: uninsdeletekeyifempty
Root: HKLM; Subkey: "SOFTWARE\Policies\Microsoft\Edge\LocalNetworkAccessAllowedForUrls"; ValueType: string; ValueName: "2"; ValueData: "http://localhost:5173"; Flags: uninsdeletekeyifempty

; Cho phép Google Chrome gọi Agent nội bộ từ VIMES HIS
Root: HKLM; Subkey: "SOFTWARE\Policies\Google\Chrome\InsecureOriginsTreatedAsSecure"; ValueType: string; ValueName: "1"; ValueData: "http://113.160.202.198:8088"; Flags: uninsdeletekeyifempty
Root: HKLM; Subkey: "SOFTWARE\Policies\Google\Chrome\InsecureOriginsTreatedAsSecure"; ValueType: string; ValueName: "2"; ValueData: "http://localhost:5173"; Flags: uninsdeletekeyifempty
Root: HKLM; Subkey: "SOFTWARE\Policies\Google\Chrome\InsecurePrivateNetworkRequestsAllowedForUrls"; ValueType: string; ValueName: "1"; ValueData: "http://113.160.202.198:8088"; Flags: uninsdeletekeyifempty
Root: HKLM; Subkey: "SOFTWARE\Policies\Google\Chrome\InsecurePrivateNetworkRequestsAllowedForUrls"; ValueType: string; ValueName: "2"; ValueData: "http://localhost:5173"; Flags: uninsdeletekeyifempty
Root: HKLM; Subkey: "SOFTWARE\Policies\Google\Chrome\LocalNetworkAccessAllowedForUrls"; ValueType: string; ValueName: "1"; ValueData: "http://113.160.202.198:8088"; Flags: uninsdeletekeyifempty
Root: HKLM; Subkey: "SOFTWARE\Policies\Google\Chrome\LocalNetworkAccessAllowedForUrls"; ValueType: string; ValueName: "2"; ValueData: "http://localhost:5173"; Flags: uninsdeletekeyifempty

[Run]
Filename: "{sys}\sc.exe"; Parameters: "create ""VIMES Workstation Agent"" binPath= ""{app}\Vimes.WorkstationAgent.exe"" start= auto"; Flags: runhidden waituntilterminated
Filename: "{sys}\sc.exe"; Parameters: "failure ""VIMES Workstation Agent"" reset= 0 actions= restart/5000"; Flags: runhidden waituntilterminated
Filename: "{sys}\sc.exe"; Parameters: "start ""VIMES Workstation Agent"""; Flags: runhidden waituntilterminated
Filename: "{app}\Vimes.WorkstationAgent.Desktop.exe"; Description: "Khởi động VIMES Desktop Companion"; Flags: nowait postinstall skipifsilent

[Icons]
Name: "{commonstartup}\VIMES Workstation Agent"; Filename: "{app}\Vimes.WorkstationAgent.Desktop.exe"; WorkingDir: "{app}"; IconFilename: "{app}\Assets\vimes.ico"

[UninstallRun]
Filename: "{sys}\taskkill.exe"; Parameters: "/F /IM Vimes.WorkstationAgent.Desktop.exe"; Flags: runhidden waituntilterminated
Filename: "{sys}\sc.exe"; Parameters: "stop ""VIMES Workstation Agent"""; Flags: runhidden waituntilterminated
Filename: "{sys}\sc.exe"; Parameters: "delete ""VIMES Workstation Agent"""; Flags: runhidden waituntilterminated

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  // Stop existing Windows Service and kill Desktop Companion to free binary files for upgrade
  Exec('sc.exe', 'stop "VIMES Workstation Agent"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec('taskkill.exe', '/F /IM Vimes.WorkstationAgent.Desktop.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec('taskkill.exe', '/F /IM Vimes.WorkstationAgent.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Sleep(1500);
  Result := '';
end;

