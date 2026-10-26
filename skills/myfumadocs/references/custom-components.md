# MyFumadocs · 自定义组件（动态篇）

> **版本敏感 / 经常变化。** 本文基于 `ActiveInsighter/exam-docs` 和 `ActiveInsighter/fumadocs-study` 的真实组件映射、Props 类型、作者说明及实际 MDX 示例整理。更新站点时重新核对源码，**不要**把这里当成永远不变的官方 Fumadocs API。通用 Markdown、数学公式和官方组件请先读 [稳定篇](../SKILL.md)。

## 统一规则

- **所有数学公式**严格使用 `$...$`（行内）和 `$$...$$`（独立）。不采用 `\( ... \)` / `\[ ... \]`；即使从 PDF/OCR 或别处迁移也统一改成美元符号。
- 这些组件由各自项目 `components/mdx.tsx` 注册；**`exam-docs` 的 `Question`/`EnglishReading` 不能默认用于 `fumadocs-study`，`fumadocs-study` 的 `MindMap`/`WordCards` 也不能默认用于 `exam-docs`**。
- 用 `.mdx` 承载 JSX 和 JS 表达式；涉及嵌套组件时，每个开闭标签完整配对，标签之间保留空行以避免 Markdown 被当纯文本。
- 所有例子使用示意 `id`，实际同一站点内不得重复。迁移内容时保留原图 / SVG 的路径，检查资源存在与大小写。
- 自定义组件变更应先核对 `components/mdx.tsx` → 组件 Props / 解析器 → `docs/*.md` → `content/docs/*.mdx` 实例 → 测试，随后只更新**本动态篇**，不轻易改稳定篇。

## 一、exam-docs：题目与解答组件（最重要）

入口：`components/mdx.tsx`；详细规范：`docs/question-components.md`；示例：`content/docs/question-types.mdx`；编译验证：`lib/remark-question.ts`。

**当前支持四个作者组件：`Question`、`Option`、`Blank`、`Solution`。** 目前**没有**可直接使用的独立 `<Answer>` 或 `<Explanation>` 标签；不要把旧版本的 `ExamAnswer / ExamExplanation / ExamQuestion` 写法迁入。

### Question 属性、题目身份与题号（2026-10-26 核对源码）

~~~mdx
<Question
  id="408-ds-2025-001"
  type="single"
  points={2}
  tags="来源:2025考研408, 科目:数据结构, 章节:绪论, 考点:算法, 难度:基础"
>

下列不属于算法基本特征的是（ ）。

<Option>有穷性</Option>
<Option>确定性</Option>
<Option correct>可读性</Option>
<Option>可行性</Option>

<Solution>可读性不是算法必备的基本特征。</Solution>

</Question>
~~~

| 属性 | 格式与限制 | 实际用途 / 页面渲染 |
| --- | --- | --- |
| `id` | **必填**，稳定且全库唯一的字符串；匹配正则 `^[A-Za-z0-9][A-Za-z0-9._-]*# MyFumadocs · 自定义组件（动态篇）

> **版本敏感 / 经常变化。** 本文基于 `ActiveInsighter/exam-docs` 和 `ActiveInsighter/fumadocs-study` 的真实组件映射、Props 类型、作者说明及实际 MDX 示例整理。更新站点时重新核对源码，**不要**把这里当成永远不变的官方 Fumadocs API。通用 Markdown、数学公式和官方组件请先读 [稳定篇](../SKILL.md)。

## 统一规则

- **所有数学公式**严格使用 `$...$`（行内）和 `$$...$$`（独立）。不采用 `\( ... \)` / `\[ ... \]`；即使从 PDF/OCR 或别处迁移也统一改成美元符号。
- 这些组件由各自项目 `components/mdx.tsx` 注册；**`exam-docs` 的 `Question`/`EnglishReading` 不能默认用于 `fumadocs-study`，`fumadocs-study` 的 `MindMap`/`WordCards` 也不能默认用于 `exam-docs`**。
- 用 `.mdx` 承载 JSX 和 JS 表达式；涉及嵌套组件时，每个开闭标签完整配对，标签之间保留空行以避免 Markdown 被当纯文本。
- 所有例子使用示意 `id`，实际同一站点内不得重复。迁移内容时保留原图 / SVG 的路径，检查资源存在与大小写。
- 自定义组件变更应先核对 `components/mdx.tsx` → 组件 Props / 解析器 → `docs/*.md` → `content/docs/*.mdx` 实例 → 测试，随后只更新**本动态篇**，不轻易改稳定篇。

## 一、exam-docs：题目与解答组件（最重要）

入口：`components/mdx.tsx`；详细规范：`docs/question-components.md`；示例：`content/docs/question-types.mdx`；编译验证：`lib/remark-question.ts`。

**当前支持四个作者组件：`Question`、`Option`、`Blank`、`Solution`。** 目前**没有**可直接使用的独立 `<Answer>` 或 `<Explanation>` 标签；不要把旧版本的 `ExamAnswer / ExamExplanation / ExamQuestion` 写法迁入。

，首位须是英文字母或数字 | **不直接当题号显示**；用于题目锚点、作答记录、收藏、个人标签和注释关联。不要按排序临时改变 id。 |
| `type` | **必填**；只能填 `single`、`multiple`、`boolean`、`blank`、`essay` | 依次显示「单选题 / 多选题 / 判断题 / 填空题 / 解答题」，同时决定选项、判分、输入框或自评交互。 |
| `points` | 可选；`points={2}` 或 `points={12.5}`，必须是**正数 JSX 表达式**，不能写 `points="2"` | 在**题型胶囊里**显示「2 分」；只负责标注分值，不代替结构化答案。 |
| `tags` | 可选；逗号分隔字符串或字符串数组，见下一节 | 按标签分类显示在题目顶部不同位置，或解答卡片考点区。 |
| `number` | 可选；`number={15}`、`number="例 1"`、`number={false}` | 数字重设显示题号并使后续接着递增；字符串自定义题号；false 隐藏且不推进自动题号。默认文档内从 1 开始。 |
| `answer` | **仅判断题使用**，写 `answer={true}` 或 `answer={false}`，不能是字符串 | 提供判断题正确答案。 |
| `buttonLabel` / `dialogTitle` | 可选字符串 | 覆盖「查看解答」按钮文字 / 无题号时的解答弹窗标题。 |

**区分三种编号：**`id` 是持久身份，`number` 是卡片显示编号，原试卷题号可以写在题干或来源标签。选项 A/B/C/D 由 `Option` 自动生成，不手写字母。修改题目、选项、答案或解析会改变自动生成的 revision，历史作答仍对应旧版本；修改 `tags` 不改变 revision。

#### tags：三类标签与真实显示位置

~~~mdx
<Question
  id="408-net-001"
  type="multiple"
  points={2}
  tags="来源:王道8套卷, 试卷:第一套, 科目:计算机网络, 考点:VLAN, 难度:较难, 易错"
>

下列关于 VLAN 的说法，正确的有（ ）。

<Option correct>VLAN 可以划分广播域</Option>
<Option>不同 VLAN 默认属于同一广播域</Option>
<Option correct>不同 VLAN 间通信通常需要三层转发</Option>

<Solution>VLAN 按逻辑划分二层广播域，不同 VLAN 之间通常通过三层设备转发。</Solution>

</Question>
~~~

| 内部类别 | 识别的前缀 / 内置关键词 | 页面显示位置 |
| --- | --- | --- |
| **题目特征**（`type`） | `题型:`、`难度:`、`标记:`、`特点:`；无前缀的 `易错`、`重点`、`难点`、`难题`、`压轴`、`高频`、`必做`、`经典`、`基础`、`拔高` | 题目顶部的题型与分值旁边，以特征标签胶囊显示。 |
| **来源路径**（`source`） | `来源:`、`出处:`、`试卷:`、`年份:`、`科目:`、`章节:` | 题目顶部的来源路径，如「王道8套卷 › 第一套 › 计算机网络」，空间不足会折叠中间项。 |
| **知识考点**（`point`） | `考点:`、`知识点:`、`考察点:` | **仅在「题目与解析」卡片的「考点」区**展示，并不直接显示在普通题目卡片顶部。 |

- 无前缀、又不是已知特征关键词的标签（如 `数据结构`、`多选题`）会默认放到**来源路径**；未知类别前缀（如 `教师:张宇`）也会默认归为来源，不会凭空新增一个独立 UI 区域。优先显式写 `科目:操作系统`、`考点:线程`、`难度:较难`。
- 标签支持 `tags="来源:2025统考, 科目:408, 考点:排序"` 与 `tags={["来源:模拟题", "易错"]}` 两种写法。字符串可用半角/全角逗号或顿号分隔，分类冒号可全角或半角；同一类别且显示值相同的标签会去重。
- **编译校验：最多 8 个标签、每个最多 32 个字符**（`lib/remark-question.ts`）。渲染层虽按类别最多接收 12 个，也不能绕过编译器的 8 个总量限制。
- 标签主要决定显示与组织，不影响自动判分；`tags` 的变更不会使作答记录的 revision 失效。
- 编译器还检查 `id` 缺失/重复/格式、`type` 不合法、`points` 非正数或写成字符串等；`tests/question-content.test.ts` 检查文档库全局 id 唯一性。

### 题目骨架与“答案 / 解析”分离

**标准答案是结构化的；解析是 `Solution` 内的富文本，两者不要混淆。**

1. **正确答案**：单/多选题由 `<Option correct>` 产生，判断题由 `<Question answer={true/false}>` 产生，填空题由 `<Blank answer="..."/>` 产生；弹窗自动显示正确答案与用户作答对照。
2. **解析说明**：写在每题**最后**的 `<Solution>...</Solution>`，可写推导、错误选项分析、图表、数学公式。解析不再单独规定选项字母，避免与结构化标准答案冲突。
3. **解答题（essay）**：无可自动判分的标准选项；在 `Solution` 内按“参考答案 / 解题步骤 / 解析”清晰分段。用户自评正确、部分正确或错误。
4. `Solution` 不会直接显示在题目卡片正文；点击“查看解答”在弹窗中展示。**不能为了“答案 / 解析”分开而编造不存在的 JSX 组件。**

#### 单选

~~~mdx
<Question id="ds-2026-001" type="single" tags="来源:408, 数据结构" points={2}>

下列哪一项不属于算法必须具备的特征？

<Option>有穷性</Option>
<Option>确定性</Option>
<Option>可行性</Option>
<Option correct>可读性</Option>

<Solution>

**解析：**算法通常要求有穷性、确定性、可行性、输入和输出；可读性是良好设计的目标，但不是必备特征。

- A、B、C：均属于算法的基本性质。
- D：正确选项。

</Solution>

</Question>
~~~

- 正确选项**只写一次**：`correct` 挂在选项上；不要在题干前手写“答案：D”或在选项内写 `A.` / `B.`。
- 选项应为 `Question` 的**直接子元素**，连续排放；`Solution` **最多一个且必须最后**。
- 建议题号、分值、出处用 `tags` / `points`，不要重复手工建立选项字母。

#### 多选

~~~mdx
<Question id="os-2026-002" type="multiple" tags="科目:操作系统, 考点:线程, 难度:基础">

以下说法正确的有（ ）。

<Option correct>线程是处理机调度的基本单位</Option>
<Option>同一进程中每个线程都有独立地址空间</Option>
<Option correct>进程是资源分配的基本单位</Option>
<Option correct>用户级线程切换可以不进入内核</Option>

<Solution>

**解析：**同一进程的线程共享进程地址空间，因此第二项错误；其余叙述正确。

</Solution>
</Question>
~~~

多选须有**至少两个**正确项。选择后点击提交才判分；漏选和错选分开提示。

#### 判断

~~~mdx
<Question id="os-2026-003" type="boolean" answer={false}>

用户级线程切换一定会引发系统调用。

<Solution>

**解析：**用户级线程可以由用户态线程库调度，不必一定陷入内核，因此此说法错误。

</Solution>
</Question>
~~~

`answer={true}` = 正确，`answer={false}` = 错误；不再写 `Option`。

#### 填空（含公式）

~~~mdx
<Question id="net-2026-004" type="blank">

TCP 位于 <Blank answer="传输层" aliases={["运输层"]} />；设 $f(x)=x^2$，则 $f'(x)=$ <Blank answer="2x" kind="math" />。

<Solution>

**解析：** TCP 属于传输层；利用幂函数求导法则 $ (x^n)'=nx^{n-1} $，得到 $f'(x)=2x$。

</Solution>
</Question>
~~~

`Blank` 常用 Props：
- `answer` 必填，可为字符串或数字，答案写法遵守数学判分器支持的**表达式文本**，如 `"2x"`、`"1/2"`；**不要在 `answer` 属性里套 `$`，它不是 LaTeX 展示区**。
- `aliases={["运输层"]}`：其它可接受文本；`kind="text"` / `kind="math"`：手动选择普通键盘或数学键盘，省略时根据答案自动判断。
- `tolerance={0.01}`：数值答案绝对误差；`placeholder="请输入"`：提示。
- 数学型目前比较数值 / 等价表达式，不能直接用于判定复杂矩阵、不等式、区间、证明过程；这类内容选择文本模式或解答题。

#### 解答题 / 大题

~~~mdx
<Question id="math-2026-005" type="essay" points={10} tags="高等数学, 定积分">

计算以下定积分：

$$
I=\int_0^1 2x\,\mathrm{d}x.
$$

<Solution>

**参考答案：**

$$
I=\left[x^2\right]_0^1=1.
$$

**解析与关键步骤：**

1. 识别被积函数 $2x$ 的一个原函数为 $x^2$。
2. 应用牛顿—莱布尼茨公式，代入上下限。
3. 最终结果为 $1$。

</Solution>
</Question>
~~~

**规范要点**：
- `id` 必填，建议稳定且全局唯一，只能使用字母、数字、点、下划线或短横；不要简单地用文档内的临时序号代替。
- `type` 必填：`single` / `multiple` / `boolean` / `blank` / `essay`。
- `tags="来源:408 统考, 数据结构"` 或 `tags={["来源:模拟卷", "考点:排序"]}`；`points={10}` 可设分值。
- 题号自动生成。`number={15}` 可重设题号并让后续递增，`number="例 1"` 自定义文本，`number={false}` 隐藏自动题号。
- 题干可用标题、数学公式、代码块、Markdown 表格和图片；题内标题不会进入全页目录。
- 编译时检查 id 唯一性、正确答案个数、标签语法、选项连续性、解答位置等；**改写必须过构建与题目测试**。

### 题目页面版式示意

~~~mdx
---
title: 第三章 栈与队列
description: 考研 408 真题练习
---

## 3.1 栈的基本概念

<Question id="ds-stack-001" type="single">
栈的插入和删除操作遵循（ ）。

<Option>FIFO</Option>
<Option correct>LIFO</Option>
<Option>随机访问</Option>
<Option>按关键字排序</Option>

<Solution>栈遵循后进先出（LIFO）。</Solution>
</Question>

---

<Question id="ds-stack-002" type="essay">
说明顺序栈判空的条件。

<Solution>

**参考答案：**在初始化 `top=-1` 的约定下，栈空时 `top==-1`。

**解析：**不同栈顶指针定义不同，应以具体实现为准。

</Solution>
</Question>
~~~

`---` 可用于分隔题目，站点会避免相邻冗余分隔线；不要额外复制“标准答案”到每道题的题干中。

### 题目与解析卡片的当前 UI

- **普通题目卡片**：顶栏为自动题号、题型图标和分值、题目特征；来源路径单列显示；右侧有收藏 / 用户标签 / 注释。中间是题干和选项或填空，底部为判分结果和「查看解答」。`Solution` 的内容不会提前显示。
- **「查看解答」学习卡片**：桌面左侧灰色面板展示只读题目镜像、考点与个人注释，右侧白色面板对非 essay 题先展示**结构化标准答案与用户答案对照**，再展示 `Solution` 对应的「解析」；essay 题右侧为「参考解答」，随后提供「正确 / 部分正确 / 错误」自评。手机端单列堆叠，长题目可折叠。
- 顶部支持**上一题 / 下一题**切换（亦支持键盘左右键 / 滑动）；「收藏与标签」库作为学习卡片的下一页进入。分页、对照、答案标记由组件提供，MDX 不应手写独立的 `Answer` / `Explanation`、翻页按钮或第二套题干。
- `Solution` 最多一个、须为直接子元素且放在最后；编译器**不强制每个题型必须有 Solution**。但 essay 题务必提供完整参考解答，否则无法有效自评。


## 二、exam-docs：英语阅读理解组件

来源：`docs/english-reading-component.md`、`content/docs/english/index.mdx`、`components/english-reading/index.tsx`。

**组件树：**`EnglishReading` 包裹 **恰好一个直接子元素** `ExamArticle` 和若干 `Question`；文章里可按段使用 `Paragraph`、`Translation`、`Evidence`。

~~~mdx
<EnglishReading>
  <ExamArticle title="A familiar park" titleTranslation="熟悉的公园" source="原创模拟文章">
    <Paragraph>
      <p>A city park can feel new when we pay attention. <Evidence for="reading-demo-001">Careful observation makes familiar places interesting.</Evidence></p>
      <Translation>留意身边的细节时，城市公园也会焕然一新。仔细观察能让熟悉的地方变得有趣。</Translation>
    </Paragraph>
    <Paragraph>
      <p>People often miss small details when they are distracted.</p>
      <Translation>分心时，人们常常错过细节。</Translation>
    </Paragraph>
  </ExamArticle>

  <Question id="reading-demo-001" type="single">
    <p lang="en">What makes familiar places interesting?</p>

    <Option correct>Careful observation.</Option>
    <Option>Expensive equipment.</Option>
    <Option>A longer journey.</Option>
    <Option>More visitors.</Option>

    <Solution>

    **解析：**定位第一段 `Evidence` 标记句，`Careful observation` 对应题干问法。其它选项缺乏原文依据。

    </Solution>
  </Question>
</EnglishReading>
~~~

- `ExamArticle`：`title`、`titleTranslation`、`source`；文章分段保留原文的自然段顺序。
- `Paragraph` 包含正文，可以用内部 `<p>...</p>`；`Translation` 放对应段的中文翻译。二者可选，不一定每段都有翻译。
- `Evidence for="reading-demo-001"`：标注**该题的定位依据**，必须与某个 `Question id` 完全一致。可标多处，**不能**用错 id；作答后可触发“原文定位”。
- 题目、选项和解析完全复用上一节的 `Question / Option / Solution`，所以五种题型及答案规则不变。
- 页面有宽屏左右分栏（分隔条可拖动）、窄屏原文/题目切换、译文开关、原文高亮、字号、展开阅读学习卡片与逐题判分/整篇提交；这些是内建交互，文档无需手工写按钮。整篇提交模式中，选择先存草稿、通过「提交全部」统一判分，未作答题不判分。
- 题干含“Paragraph 2”等段落引用时，组件可生成跳段快捷入口；写作时注意引用的实际段号。

## 三、fumadocs-study：MindMap / Markmap 交互思维导图

这是 `MindMap` **自定义组件**，内部使用 `markmap-lib` + `markmap-view`，并非 Fumadocs 官方的 Mermaid；它接收 **Markdown 字符串**，不是把 `<MindMap>` 下方的普通列表自动转成树。

~~~mdx
<MindMap
  title="计算机网络知识树"
  height={520}
  initialExpandLevel={2}
  maxWidth={260}
  markdown={String.raw`
# 计算机网络
## 网络层
### IP 数据报
### 路由选择
## 传输层
### TCP
- 三次握手
- 流量控制
### UDP
`}
/>
~~~

上例中的 `String.raw` 后面实际应使用 **JavaScript 模板字符串反引号**（```）而非其他引号字符；避免转义 Markdown 换行与公式命令。用在真实 MDX 时确保属性表达式是 `markdown={String.raw`...`}`。

Props：
- `markdown` **必填字符串**，标题 `#` / `##` / `###`、子列表 `-` 控制树形层级；非空且结构有效。
- `title?`：可访问性标题，默认“思维导图”。
- `height?`：像素数字或 CSS 字符串，默认使用响应式高度。
- `initialExpandLevel?`：初始展开层数，默认 `3`，`-1` 全展开。
- `maxWidth?`：节点文字最大宽度，默认 `280`；`className?` 可选。
- 工具栏包含缩放、适配视图、全部展开/折叠、恢复默认、全屏；无需在内容中重复定义。

**注意：**标注为 ````mermaid` 的围栏绘制 Mermaid；`MindMap markdown={...}` 才是交互 Markmap。不要用 ````markmap` 围栏代替当前已注册的组件，除非后续专门实现了该语法。

源码：`components/mdx/mind-map.tsx`、`components/mdx/mind-map-hook.ts`。

## 四、fumadocs-study：WordCards 单词卡片与短语卡

注册组件：`WordCards` + `WordCardModeToggle`；来源：`components/vocabulary/word-card-content.tsx`、`components/vocabulary/word-cards.tsx`；真实示例：`content/docs/english/word-cards-demo.mdx` 与 `data/vocabulary/word-cards-demo.json`。

在 MDX 中传入**结构化对象数组**，不要写每张卡一套不受支持的 `<WordCard>...</WordCard>` JSX。

~~~mdx
<WordCardModeToggle />

<WordCards
  words={[
    {
      word: 'derive',
      phonetic: '/dɪˈraɪv/',
      label: '考频 7',
      meanings: [
        { pos: 'v.', text: '获得；取得', key: true, grammar: 'derive A from B' },
        { pos: 'v.', text: '源自；起源于' },
      ],
      senses: [
        {
          gloss: '获得；取得',
          count: 5,
          examples: [
            { text: 'Many medicines are derived from plants.', translation: '许多药物来源于植物。' },
          ],
        },
        { gloss: '源自；起源于', count: 2 },
      ],
    },
    {
      word: 'in terms of',
      label: '短语 9',
      meanings: [
        { text: '就……而言', phrase: true, key: true },
      ],
    },
  ]}
/>
~~~

### 数据模型（以源码 Props 为准）

| 对象 | 属性 | 含义 |
| --- | --- | --- |
| `WordCardData` | `word: string`（必填） | 单词 / 短语文本 |
|  | `phonetic?: string`、`label?: string` | 音标、频度标签 |
|  | `meanings: WordMeaning[]`（必填） | 词义摘要 |
|  | `senses?: WordSense[]` | 多义项详情 |
| `WordMeaning` | `text: string`（必填） | 中文解释 |
|  | `pos?`、`key?`、`grammar?`、`phrase?` | 词性、重点、搭配、是否短语 |
| `WordSense` | `gloss: string`、`count: number`（必填） | 义项释义、频次 |
|  | `percentage?: number`、`examples?: WordExample[]` | 比例覆盖、例句 |
| `WordExample` | `text: string`、`translation: string`（均必填） | 英文原句与中文翻译 |

- 比例通常按同一单词下的 `count / sum(count)` 计算；`percentage` 可以覆盖，需为合理数值。
- `WordCardModeToggle` 的当前四种实际模式为 **`compact` 精简、`dictation` 默写（隐藏单词/音标）、`translation` 翻译（隐藏释义）、`full` 完整**；状态由 `WordCardsProvider` 管理并保存在 localStorage。只需在页面放一次切换器，无需逐卡手写模式状态。
- 数据量大时优先把数组维护在 `data/vocabulary/*.mjs` / `*.json`，通过 `import` 传给 `<WordCards words={...} />`，可用 `slice(start,end)` 按单元拆分；不要在数百张 MDX 卡片里重复复制对象。
- `WordCards` 的 `words` 必填，`empty` 可选（词数组为空时显示替代内容）。缺少 `meanings` 或数据结构错误会导致组件无法正常显示；优先匹配现有演示数据 schema。

外部数据示例（与仓库现状一致）：

~~~mdx
import demoWords from '../../../data/vocabulary/word-cards-demo.mjs';

<WordCardModeToggle />

<WordCards words={demoWords} />
~~~

相对路径根据**MDX 文件所处目录**调整，勿机械复制。

## 动态篇每次更新的核对清单

1. 比对 `exam-docs/components/mdx.tsx`：当前注册的题目及阅读组件名字；`components/question/question.tsx` / `parts.tsx`：类型和 Props；`lib/remark-question.ts`：编译限制。
2. 查看 `exam-docs/docs/question-components.md` 和 `docs/english-reading-component.md` 是否更新，并用 `content/docs/question-types.mdx`、`content/docs/english/index.mdx` 检验示例。
3. 比对 `fumadocs-study/components/mdx.tsx`、`components/mdx/mind-map.tsx`、`components/vocabulary/word-card-content.tsx` 及示例数据。
4. 优先更新本文件中的准确组件树、属性表和最小可运行示例；不要修改稳定篇的官方 API 描述。
5. 运行各自项目已有构建与测试（至少 MDX 编译和题目结构校验）；确认新例子适用于实际注册表。若未验证，不声称已通过。

**源代码入口**
- https://github.com/ActiveInsighter/exam-docs/blob/main/docs/question-components.md
- https://github.com/ActiveInsighter/exam-docs/blob/main/docs/english-reading-component.md
- https://github.com/ActiveInsighter/fumadocs-study/blob/main/components/mdx/mind-map.tsx
- https://github.com/ActiveInsighter/fumadocs-study/blob/main/components/vocabulary/word-card-content.tsx
