# バックエンドアーキテクチャ図

## 全体構成

```mermaid
graph TB
    %% Frontend
    FE[Frontend<br/>Angular 20]

    %% Backend Main
    BE[Backend<br/>Express Server<br/>Port 3000]

    %% WebSocket
    WS[WebSocket Service<br/>Socket.IO]

    %% Amazon Q CLI
    QCLI[Amazon Q CLI<br/>Service]

    %% Database
    DB[(SQLite3<br/>Database)]

    %% Amazon Q Process
    QP[Amazon Q<br/>CLI Process]

    %% Connections
    FE -.->|HTTP/WebSocket<br/>localhost:4200 -> 3000| BE
    FE -.->|WebSocket| WS
    BE --> WS
    WS --> QCLI
    QCLI --> QP
    QCLI --> DB

    %% Styling
    classDef frontend fill:#e1f5fe
    classDef backend fill:#f3e5f5
    classDef service fill:#e8f5e8
    classDef data fill:#fff3e0
    classDef external fill:#ffebee

    class FE frontend
    class BE backend
    class WS,QCLI service
    class DB data
    class QP external
```

## バックエンドサービス詳細構成

```mermaid
graph TB
    %% Main Entry Point
    Main[index.ts<br/>Express Server]

    %% Routes
    Routes[routes/<br/>API Endpoints]

    %% Services
    subgraph Services[Services]
        AQC[amazon-q-cli/]
        AQH[amazon-q-history/]
        AQHT[amazon-q-history-transformer/]
        AQMF[amazon-q-message-formatter/]
        WS[websocket/]
    end

    %% Utils
    subgraph Utils[Utils]
        AS[ansi-stripper/]
        CV[cli-validator/]
        EF[error-factory/]
        ER[errors/]
        IDG[id-generator/]
        PV[path-validator/]
    end

    %% Types
    subgraph Types[Types]
        AQT[amazon-q.ts]
        CT[common.ts]
        WST[websocket.ts]
    end

    %% Tests
    subgraph Tests[Tests]
        UT[Unit Tests]
        IT[Integration Tests]
        E2E[End-to-End Tests]
    end

    %% Connections
    Main --> Routes
    Routes --> Services
    Services --> Utils
    Services --> Types
    Utils --> Types
    Tests --> Services
    Tests --> Utils

    %% Styling
    classDef main fill:#e3f2fd
    classDef service fill:#e8f5e8
    classDef util fill:#fff3e0
    classDef type fill:#f3e5f5
    classDef test fill:#ffebee

    class Main main
    class AQC,AQH,AQHT,AQMF,WS service
    class AS,CV,EF,ER,IDG,PV util
    class AQT,CT,WST type
    class UT,IT,E2E test
```

## Amazon Q CLI サービス詳細

```mermaid
graph TB
    %% Main Service
    AQCS[AmazonQCLIService<br/>index.ts]

    %% Sub-modules
    subgraph BufferManager[buffer-manager/]
        BM1[add-to-initialization-buffer.ts]
        BM2[combine-initialization-messages.ts]
        BM3[flush-incomplete-error-line.ts]
        BM4[flush-incomplete-output-line.ts]
        BM5[flush-initialization-buffer.ts]
        BM6[flush-output-buffer.ts]
    end

    subgraph CliChecker[cli-checker/]
        CC1[build-command-args.ts]
        CC2[check-cli-availability.ts]
    end

    subgraph MessageHandler[message-handler/]
        MH1[classify-stderr-message.ts]
        MH2[get-info-message-type.ts]
        MH3[handle-stderr.ts]
        MH4[handle-stdout.ts]
        MH5[setup-process-handlers.ts]
        MH6[various utility functions...]
    end

    subgraph ProcessManager[process-manager/]
        PM1[spawn-process.ts]
        PM2[kill-process.ts]
        PM3[monitor-resources.ts]
        PM4[cleanup-inactive-sessions.ts]
        PM5[setup-cleanup-handlers.ts]
    end

    subgraph SessionManager[session-manager/]
        SM1[create-session.ts]
        SM2[get-session.ts]
        SM3[abort-session.ts]
        SM4[send-input.ts]
        SM5[various session functions...]
    end

    %% Connections
    AQCS --> BufferManager
    AQCS --> CliChecker
    AQCS --> MessageHandler
    AQCS --> ProcessManager
    AQCS --> SessionManager

    %% Styling
    classDef main fill:#e3f2fd
    classDef module fill:#e8f5e8

    class AQCS main
    class BM1,BM2,BM3,BM4,BM5,BM6 module
    class CC1,CC2 module
    class MH1,MH2,MH3,MH4,MH5,MH6 module
    class PM1,PM2,PM3,PM4,PM5 module
    class SM1,SM2,SM3,SM4,SM5 module
```

## WebSocket サービス詳細

```mermaid
graph TB
    %% Main Service
    WSS[WebSocketService<br/>index.ts]

    %% Sub-modules
    subgraph AmazonQHandler[amazon-q-handler/]
        AQH1[handle-q-command.ts]
        AQH2[handle-q-abort.ts]
        AQH3[handle-q-history.ts]
        AQH4[handle-q-message.ts]
        AQH5[setup-q-cli-event-handlers.ts]
        AQH6[session management functions...]
    end

    subgraph ConnectionManager[connection-manager/]
        CM1[handle-connection.ts]
        CM2[handle-disconnection.ts]
        CM3[get-connected-users.ts]
        CM4[connection-map.ts]
    end

    subgraph RoomManager[room-manager/]
        RM1[handle-room-join.ts]
        RM2[handle-room-leave.ts]
        RM3[broadcast-to-room.ts]
        RM4[broadcast-to-all.ts]
        RM5[room-map.ts]
    end

    subgraph ErrorHandler[error-handler/]
        EH1[send-error.ts]
        EH2[setup-global-error-handling.ts]
    end

    subgraph EventSetup[event-setup/]
        ES1[setup-event-handlers.ts]
    end

    subgraph MessageHandler[message-handler/]
        MH1[handle-message-send.ts]
    end

    %% Connections
    WSS --> AmazonQHandler
    WSS --> ConnectionManager
    WSS --> RoomManager
    WSS --> ErrorHandler
    WSS --> EventSetup
    WSS --> MessageHandler

    %% Styling
    classDef main fill:#e3f2fd
    classDef module fill:#e8f5e8

    class WSS main
    class AQH1,AQH2,AQH3,AQH4,AQH5,AQH6 module
    class CM1,CM2,CM3,CM4 module
    class RM1,RM2,RM3,RM4,RM5 module
    class EH1,EH2 module
    class ES1 module
    class MH1 module
```

## データフロー図

```mermaid
sequenceDiagram
    participant U as User (Frontend)
    participant WS as WebSocket Service
    participant AQ as Amazon Q CLI Service
    participant CLI as Amazon Q CLI Process
    participant DB as SQLite Database

    U->>WS: WebSocket connection
    WS->>AQ: Initialize session
    AQ->>CLI: Spawn Q process
    CLI-->>AQ: Process ready
    AQ-->>WS: Session created
    WS-->>U: Connection established

    U->>WS: Send Q command
    WS->>AQ: Execute command
    AQ->>CLI: Send input
    CLI-->>AQ: Output data
    AQ->>DB: Store history
    AQ-->>WS: Formatted response
    WS-->>U: Real-time output

    U->>WS: Request history
    WS->>AQ: Get history
    AQ->>DB: Query history
    DB-->>AQ: History data
    AQ-->>WS: Formatted history
    WS-->>U: History response
```

## テストアーキテクチャ

```mermaid
graph TB
    %% Test Types
    subgraph TestSuite[Test Suite]
        UT[Unit Tests<br/>Individual Functions]
        IT[Integration Tests<br/>Service Integration]
        E2E[End-to-End Tests<br/>Complete Workflows]
    end

    %% Test Targets
    subgraph TestTargets[Test Targets]
        UTT[Utils Functions<br/>- ID Generator<br/>- Path Validator<br/>- ANSI Stripper<br/>- CLI Validator]
        ITT[Service Integration<br/>- Amazon Q CLI Service<br/>- WebSocket Service<br/>- Combined Integration]
        E2ET[Complete Workflows<br/>- WebSocket + Amazon Q<br/>- History Management<br/>- Error Handling]
    end

    %% Test Coverage
    subgraph Coverage[Test Coverage]
        TC1[✅ All Utils: 100%]
        TC2[✅ Services: Full Integration]
        TC3[✅ E2E: Core Workflows]
    end

    %% Connections
    UT --> UTT
    IT --> ITT
    E2E --> E2ET
    UTT --> TC1
    ITT --> TC2
    E2ET --> TC3

    %% Styling
    classDef test fill:#e8f5e8
    classDef target fill:#fff3e0
    classDef coverage fill:#e3f2fd

    class UT,IT,E2E test
    class UTT,ITT,E2ET target
    class TC1,TC2,TC3 coverage
```

## 1ファイル1関数アーキテクチャの利点

### モジュール性

- 各関数が独立したファイルに分離
- 関数の責任範囲が明確
- テストが容易

### 保守性

- 変更影響範囲が限定的
- デバッグが容易
- コードレビューが効率的

### 再利用性

- 関数の再利用が容易
- 他のプロジェクトへの移植性
- 依存関係の明確化

### テスト容易性

- 単体テストが書きやすい
- モックが作りやすい
- テストの独立性が保たれる
