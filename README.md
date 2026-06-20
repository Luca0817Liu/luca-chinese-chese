# 🇨🇳 中国象棋独立博弈 AI 独立引擎模块 (Offline Chinese Chess Bot Engine)

本项目已完整、高质量地重构并上线了一套**完全不依赖外部任何大模型 API、断网离线、零延迟**的**中国象棋纯代码博弈 AI 独立模块**。采用经典的 [极大极小值算法 (Minimax) + Alpha-Beta 剪枝 + 局面走法排序 (Move Ordering) + 局面置换缓存** 架构，各模块相互隔离，分层极度严密及清晰。

## 🪐 一、 博弈系统分层架构设计

AI 博弈系统按照工业级标准分成以下 6 个**独立子模块**：

1. **State.ts (状态引擎)**：
   - 存储管理 `10x9` 二维棋盘及红黑双方落子状态。
   - 使用统一数值编码（空=0，红方=11..17，黑方=21..27）。
   - 管理国王核心坐标缓存、走法快照栈 `move_stack`（支持搜索回溯、撤销）。

2. **Rule.ts (规则引擎静态验证功臣)**：
   - 全套象棋静态走子逻辑（车通透扫描、炮炮架越子吃子、马蹩马腿、相塞象眼与不过河、士帅局限于九宫、兵卒过河横移等）。
   - 提供将帅同直线对面相见直杀机制。

3. **MoveGen.ts (合法走法生成器)**：
   - 遍历己方棋子并进行静态合规逻辑过滤。
   - **剪枝性能爆发点**：内置高价值吃子（Capture）走法优先排序，让高质量的分支优先在 `Alpha-Beta` 中被探索，从而大幅加速 Beta 剪枝截断。

4. **Eval.ts (局面静态估值核心)**：
   - 分配经典子力价值权重（车900，炮450，马400，相士120，未过河兵100，过河兵200）。
   - 内置高质量的**分色棋子矩形位置加分矩阵 (Piece-Square Tables, PST)**。如马在河口与中心点位重力加分、兵压敌方九宫极值加分、将帅安全区定位、边缘马贬值等。

5. **Search.ts (博弈搜索内核)**：
   - 基于深度限制的极大极小递归（MiniMax）。
   - 主动实施 Alpha-Beta 双向搜索剪枝，毫秒级快速切断无用决策链路。
   - 内置**全局置换局面缓存器 (Transposition Table)**，将重复对称的搜索树节点全局去重。

6. **BotAPI.ts (统一对外业务接口)**：
   - 唯一暴露给应用层/后端的接口，通过高级格式映射器将 UI 数组与博弈引擎无感同步。

---

## 🛠️ 二、 使用指南与调用文档

本游戏采用 React + Tailwind 框架开发，您在业务系统中只需直接调换 `BotAPI` 即可。

### 1. 如何初始化标准象棋棋盘
```typescript
import { INITIAL_PIECES } from './types';
import { BotAPI } from './engine/BotAPI';

// INITIAL_PIECES 包含红黑32子开局正规网格数据。
// 可随时通过 BotAPI 转化为 AI 状态矩阵：
const matrix = BotAPI.convertWebBoardToMatrix(boardState);
```

### 2. 如何调用 AI 获取最优落子
调用静态方法 `get_ai_move(boardState, currentTurn, depth)` 即可：
```typescript
import { BotAPI } from './engine/BotAPI';

// 传入当前棋盘、当前执子方 (如 'black')、搜索层级 (depth)
const bestMove = BotAPI.get_ai_move(board, 'black', 3);

if (bestMove) {
  console.log(`AI 决定将棋子由 Row:${bestMove.from.r}, Col:${bestMove.from.c} 移动到 Row:${bestMove.to.r}, Col:${bestMove.to.c}`);
}
```

### 3. 如何配置及切换人机难度 (Difficulty Levels)
我们在 UI 层提供了一体化、可流畅切换的滑动 pill 组件：
- **Easy (简单) — 深度 2 次探索**：决策时间 < 10ms，适合初学者体验。
- **Medium (普通) — 深度 3 次探究**：决策时间 ~ 40ms，具备中等棋力，防守和进攻得当。
- **Hard (硬核玩家) — 深度 4 次远瞻**：决策时间 ~ 180ms，考虑多达上万个局面，走步稳健、杀伤力高。
