[Setup]
AppName=VIMES Workstation Agent
AppVersion=1.1.0
DefaultDirName={autopf}\VIMES Workstation Agent
OutputDir=.
OutputBaseFilename=Vimes-Workstation-Agent-Setup
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
SetupIconFile=vimes.ico
UninstallIconFile=vimes.ico

[Files]
Source: "..\publish\win-x64\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion

[Run]
Filename: "{sys}\sc.exe"; Parameters: "create ""VIMES Workstation Agent"" binPath= ""{app}\Vimes.WorkstationAgent.exe"" start= auto"; Flags: runhidden waituntilterminated
Filename: "{sys}\sc.exe"; Parameters: "start ""VIMES Workstation Agent"""; Flags: runhidden waituntilterminated
Filename: "{app}\Vimes.WorkstationAgent.Desktop.exe"; Description: "Khởi động VIMES Desktop Companion"; Flags: nowait postinstall skipifsilent

[Icons]
Name: "{commonstartup}\VIMES Workstation Agent"; Filename: "{app}\Vimes.WorkstationAgent.Desktop.exe"; WorkingDir: "{app}"; IconFilename: "{app}\Assets\vimes.ico"

[UninstallRun]
Filename: "{sys}\sc.exe"; Parameters: "stop ""VIMES Workstation Agent"""; Flags: runhidden waituntilterminated
Filename: "{sys}\sc.exe"; Parameters: "delete ""VIMES Workstation Agent"""; Flags: runhidden waituntilterminated
