import { Logger } from './Logger';
import * as fs from 'fs';
import * as path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import * as XLSX from 'xlsx';
import { Console } from 'console';

const projectPath = path.resolve(__dirname, '../');

/**
 * 数据存储接口
 */
interface EngineData {
    excel: { [key: string]: any };
    json: { [key: string]: any };
    direct: { [key: string]: any };
}

/**
 * 数据加载方法接口
 */
interface LoadDataMethods {
    setExcelData: (dataName: string, filePath: string) => void;
    setJsonData: (dataName: string, jsonData: any) => void;
    setDirectData: (dataName: string, data: string) => void;
}

/**
 * 读取数据方法接口
 */
interface ReadDataMethods {
    readExcelData: (dataName: string, sheetName: string, cellName: string, vOrW: boolean) => any;
    readJsonData: (dataName: string, path: string) => any;
    readDirectData: (dataName: string) => any;
}

/**
 * 基本的文档模板引擎类
 */
export class DocxTemplateEngine {
    private templateFilePath: string;
    private outputFilePath: string;
    private logger: Logger;
    private docxZip: PizZip;
    public data: EngineData = {
        excel: {}, // Excel数据
        json: {}, // JSON数据
        direct: {} // 直接赋值
    };
    private templatesRules: Array<Object> = [];
    private templates: Array<{ tag: string, value: string }> = [];

    /**
     * 构造函数
     * @param templatePath 模板文件路径
     * @param outputPath 输出文件路径
     */
    constructor(templateFilePath: string, outputFilePath: string = './output.docx') {
        this.templateFilePath = templateFilePath;
        this.outputFilePath = outputFilePath;
        this.docxZip = new PizZip(fs.readFileSync(this.templateFilePath));
        this.logger = new Logger('DocxTemplateEngine');
        this.logger.info('DocxTemplateEngine 实例已创建', `模板路径: ${templateFilePath}, 输出路径: ${outputFilePath}`);
    }

    public getTemplates(): Array<{ tag: string, value: string }> {
        this.logger.info('解析模板占位符', `模板路径: ${this.templateFilePath}`);
        this.templates = []; // 清空之前的数据

        const that = this;
        new Docxtemplater(this.docxZip, {
            parser(tag: string): any {
                that.templates.push({
                    tag,
                    value: '' // 默认空值，后面会填充
                });
                return {
                    get(scope: any, context: any): any {
                        return scope[tag];
                    }
                };
            }
        });

        // try {
        //     doc.render({}); // 触发parser解析
        // } catch (error) {
        //     // 忽略渲染错误，我们只要解析出tags
        // }

        return this.templates;
    }

    /**
     * 获取Logger实例，用于外部访问日志功能
     */
    public getLogger(): Logger {
        return this.logger;
    }

    /**
     * 获取模板路径
     */
    public getTemplatePath(): string {
        return this.templateFilePath;
    }

    /**
     * 获取输出路径
     */
    public getOutputPath(): string {
        return this.outputFilePath;
    }

    /**
     * 设置输出路径
     */
    public setOutputPath(path: string): void {
        const oldPath = this.outputFilePath;
        this.outputFilePath = path;
        this.logger.info(`输出路径已更新`, `从 ${oldPath} 更新为 ${path}`);
    }





    /**
     * 加载数据相关方法
     * setExcelData: 设置Excel数据
     * setJsonData: 设置JSON数据
     * setDirectData: 设置直接赋值的数据
     */
    public loadData: LoadDataMethods = {
        // 设置Excel数据
        setExcelData: (dataName: string, filePath: string) => {
            try {
                const workbook = XLSX.readFile(filePath);
                this.data.excel[dataName] = workbook;
                this.logger.info(`加载数据成功`, `数据名称: ${dataName}, 文件路径: ${filePath}`);
            } catch (error) {
                this.logger.error(`加载数据失败`, `数据名称: ${dataName}, 文件路径: ${filePath}, 错误信息: ${error}`);
            }
        },
        // 设置JSON数据
        setJsonData: (dataName: string, filePath: string) => {
            try {
                const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                this.data.json[dataName] = jsonData;
                this.logger.info(`加载数据成功`, `数据名称: ${dataName}, 文件路径: ${filePath}`);
            } catch (error) {
                this.logger.error(`加载数据失败`, `数据名称: ${dataName}, 文件路径: ${filePath}, 错误信息: ${error}`);
            }
        },
        // 读取直接赋值的数据
        setDirectData: (dataName: string, data: string) => {
            try {
                this.data.direct[dataName] = data;
                this.logger.info(`加载数据成功`, `数据名称: ${dataName}, 数据: ${data}`);
            } catch (error) {
                this.logger.error(`加载数据失败`, `数据名称: ${dataName}, 数据: ${data}, 错误信息: ${error}`);
            }
        }
    }

    /**
     * 读取数据相关方法
     * readExcelData: 读取Excel数据
     * readJsonData: 读取JSON数据
     * readDirectData: 读取直接赋值的数据
     */
    public readData: ReadDataMethods = {
        // 读取Excel数据
        readExcelData: (dataName: string, sheetName: string, cellName: string, vOrW: boolean = true) => {

            try {


                // 数据源
                const workbook = this.data.excel[dataName];
                if (workbook === undefined || workbook === null) {
                    this.logger.error(`数据源不存在`, `数据源: ${dataName}`);
                    return '';
                }

                // 工作表
                const sheet = workbook.Sheets[sheetName];
                if (sheet === undefined || sheet === null) {
                    this.logger.error(`数据源工作表不存在`, `数据源: ${dataName}, 工作表: ${sheetName}`);
                    return '';
                }

                // 单元格
                const cell = sheet[cellName];
                if (cell === undefined || cell === null) {
                    this.logger.warn(`读取到空数据`, `数据名称: ${dataName}, 数据: ${cellName}`);
                    return '';
                }
                return vOrW ? cell.v : cell.w; // 根据vOrW参数决定返回值是v还是w
            } catch (error) {

                this.logger.error(`读取excel数据失败`, `数据名称: ${dataName}, sheetname: ${sheetName}, 数据: ${cellName}, 错误信息: ${error}`);
                return '';
            }
        },
        readJsonData: (dataName: string, path: string) => {
            try {
                const jsonData = this.data.json[dataName];
                if (!jsonData) {
                    this.logger.warn(`JSON数据不存在`, `数据名称: ${dataName}`);
                    return '';
                }

                // 解析复合路径，如 "数据[0].数据A"
                const result = this.getValueByPath(jsonData, path);
                return result !== undefined ? result : '';
            } catch (error) {
                this.logger.error(`读取json数据失败`, `数据名称: ${dataName}, 路径: ${path}, 错误信息: ${error}`);
                return '';
            }
        },
        readDirectData: (dataName: string) => {
            try {
                return this.data.direct[dataName];
            } catch (error) {
                this.logger.error(`读取直接赋值数据失败`, `数据名称: ${dataName}, 错误信息: ${error}`);
                return '';
            }
        }
    }

    /**
     * 根据路径从对象中获取值
     * @param obj 目标对象
     * @param path 路径字符串，支持如 "数据[0].数据A" 的复合路径
     * @returns 解析后的值
     */
    private getValueByPath(obj: any, path: string): any {
        try {
            // 将路径分割为数组，处理点号和方括号
            const keys = path.replace(/\[(\w+)\]/g, '.$1').split('.').filter(key => key !== '');

            let result = obj;
            for (const key of keys) {
                if (result === null || result === undefined) {
                    return undefined;
                }
                result = result[key];
            }

            return result;
        } catch (error) {
            this.logger.error(`路径解析失败`, `路径: ${path}, 错误信息: ${error}`);
            return undefined;
        }
    }

    /**
     * 根据规则加载数据
     * @param rule 规则
     */
    public loadDataByRule(rule: any) {
        for (let i = 0; i < rule.length; i++) {
            if (rule[i].type == 'excel') {
                this.loadData.setExcelData(rule[i].varname, rule[i].path);
            } else if (rule[i].type == 'json') {
                this.loadData.setJsonData(rule[i].varname, rule[i].path);
            } else if (rule[i].type == 'direct') {
                this.loadData.setDirectData(rule[i].varname, rule[i].value);
            }
        }

        /**
         * [
         *  {
         *  varname:'计划比',
         *  type:'excel',
         *  path:'../报表说明书/计划比.xlsx',
         *  },
         * {
         *  varname:'用户名',
         *  type:'json',
         *  path:'../报表说明书/用户名.json',
         * },
         *  {
         *  varname:'用户名',
         *  type:'direct',
         *  value:'张三'
         *  }
         * ]
         */

    }

    /**
     * 设置模板规则
     * @param rules 模板规则
     */
    public setTemplatesRules(rules: Array<Object>): void {
        this.templatesRules = rules;
    }

    public generateData(templates: Array<{ tag: string }>) {
        for (let i = 0; i < templates.length; i++) {
            let tag = templates[i].tag;

            // 检测是否是命令
            let commandObject = this.detectCommandTag(tag);
            if (commandObject !== false) {
                this.executeCommand(templates[i], commandObject.command, commandObject.params);
                this.logger.info(`执行命令`, `命令: ${commandObject.command}, 参数: ${commandObject.params}`);
                continue;
            }

            // 检测是否是模板变量
            let value = this.detectVarname(tag);
            if (value !== false) {
                this.templates[i].value = value.format;
                this.logger.info(`获取变量值`, `变量: ${tag}, 值: ${value.format}`);
                continue;
            }
        }
    }

    /**
     * 检测是否是命令
     * @param tag 标签
     * @returns 命令对象 {command:string,params:string[]}
     */
    public detectCommandTag(tag: string): { command: string, params: string[] } | false {
        // 检查是否是命令格式：$命令(参数1,参数2)
        if (!tag.startsWith('$')) {
            return false;
        }

        // 使用正则表达式解析命令格式
        const commandRegex = /^\$(\w+)\((.*?)\)$/;
        const match = tag.match(commandRegex);

        if (!match) {
            return false;
        }

        const command = match[1]; // 命令名称
        const paramsString = match[2]; // 参数字符串

        // 解析参数，处理空参数的情况
        let params: string[] = [];
        if (paramsString.trim() !== '') {
            params = paramsString.split(',').map(param => param.trim());
        }

        return {
            command,
            params
        };
    }

    /**
     * 执行命令
     * @param command 命令
     * @param params 参数
     */
    public executeCommand(template: any, command: string, params: string[]) {
        console.log('模板 -> ', template);
        console.log('命令 -> ', command);

        // 命令：v(变量名,正数显示,负数显示)
        if (command == 'v') {
            let valueObject = this.getDataByVarname(params[0]);
            console.log('value -> ', valueObject);
            let number = parseFloat(valueObject.value);
            if (number > 0) {
                template.value = params[1] + valueObject.format;
            } else {
                template.value = params[2] + valueObject.format;
            }
        }

        // 命令：c(变量名,零值文本,非零值前置文本,正数显示,负数显示,单位)
        if (command == 'c') {
            let valueObject = this.getDataByVarname(params[0]);
            let number = parseFloat(valueObject.value);
            if (number == 0) {
                template.value = params[1]
            } else if (number > 0) {
                template.value = params[2] + params[3] + valueObject.format + params[5]
            } else {
                template.value = params[2] + params[4] + valueObject.format + params[5]
            }
        }

        // 命令:dual
        // $dual 命令 {$dual(其他业务销售明细表D8,其他业务销售明细表D9,本月销售煤泥$0万元##$1万吨,本月未销售煤泥)}
        // 参数：变量名1,变量名2,有数据模板($0=金额,$1=量,用##代替逗号),无数据模板
        if (command == 'dual') {
            let varname1 = params[0] // 变量名1
            let varname2 = params[1] // 变量名2
            let hasDataTemplate = params[2] // 有数据时的模板
            let noDataDesc = params[3] // 无数据时的描述

            let amountValue = this.getDataByVarname(varname1)
            let quantityValue = this.getDataByVarname(varname2)

            this.logger.debug('$dual命令数据检查', `varname1: ${varname1}, amountValue: ${JSON.stringify(amountValue)}, varname2: ${varname2}, quantityValue: ${JSON.stringify(quantityValue)}`);

            // 判断条件：两个值都存在且都大于0时才显示数据
            // 需要检查数据类型不是'no-data'，且值大于0
            let hasValidAmount = amountValue && amountValue.type !== 'no-data' && amountValue.value !== '' && Number(amountValue.value) > 0;
            let hasValidQuantity = quantityValue && quantityValue.type !== 'no-data' && quantityValue.value !== '' && Number(quantityValue.value) > 0;

            if (hasValidAmount && hasValidQuantity) {
                template.value = hasDataTemplate.replace('$0', amountValue.format).replace('$1', quantityValue.format).replace('##', ',')
                this.logger.debug('$dual命令使用有数据模板', `结果: ${template.value}`);
            } else {
                template.value = noDataDesc
                this.logger.debug('$dual命令使用无数据模板', `结果: ${template.value}`);
            }
        }

        console.log('替换后 -> ', template);
    }

    /**
     * 检测是否符合setTemplatesRules的varname规则
     * @param tag 标签
     * @returns 是否符合setTemplatesRules的varname规则
     */
    public detectVarname(tag: string) {
        for (let i = 0; i < this.templatesRules.length; i++) {
            if (tag.startsWith((this.templatesRules[i] as any).varname) === true) {
                return this.getDataByVarname(tag);
            }
        }
        return false
    }

    /**
     * 根据varname获取数据
     * @param varname 变量名
     * @returns 数据
     */
    public getDataByVarname(varname: string) {
        for (let i = 0; i < this.templatesRules.length; i++) {
            // 判断varname是否以模板规则(templatesRules)的varname开头
            if (varname.startsWith((this.templatesRules[i] as any).varname) === false) {
                continue;
            }

            // 根据模板规则(templatesRules)的type类型，读取数据
            let type = (this.templatesRules[i] as any).type;

            // 根据模板规则(templatesRules)的type类型，读取数据
            if (type == 'excel') { // 读取Excel数据
                let dataSourceName = (this.templatesRules[i] as any).varname;
                let sheetname = (this.templatesRules[i] as any).rules.sheetname;

                let vOrW = (this.templatesRules[i] as any).rules.vOrW;
                let cellName = varname.replace(dataSourceName, '');
                this.logger.info(`读取Excel数据`, `varname名称: ${varname}, 数据源: ${dataSourceName}, sheetname: ${sheetname}, cellName: ${cellName}, vOrW: ${vOrW}`);


                let format = (this.templatesRules[i] as any).format;
                let formatFunction = this.getFormatFunction(format) || this.formatFunctions.original;
                let value = this.readData.readExcelData(dataSourceName, sheetname, cellName, vOrW);

                return {
                    varname: varname,
                    type: 'excel',
                    value: value,
                    format: formatFunction(value).format
                }
            } else if (type == 'json') { // 读取JSON数据
                let path = (this.templatesRules[i] as any).rules.path;
                return {
                    varname: varname,
                    type: 'json',
                    value: this.readData.readJsonData(varname, path),
                    format: this.formatFunctions.original(this.readData.readJsonData(varname, path)).format
                }
            } else if (type == 'direct') { // 读取直接赋值的数据
                return {
                    varname: varname,
                    type: 'direct',
                    value: this.readData.readDirectData(varname),
                    format: this.formatFunctions.original(this.readData.readDirectData(varname)).format
                }
            }
        }

        return {
            varname: varname,
            type: 'no-data',
            value: '',
            format: ''
        }
    }

    public formatFunctions = {
        // 返回原始值
        original: (value: any) => {
            return {
                value: value,
                type: 'string',
                format: String(value)
            }
        },

        // 将数字转换为带千位符的字符串并去掉负号
        formatToChineseNumber: (value: any) => {
            const num = Number(value) || 0;
            return {
                value: value,
                type: 'number',
                format: num.toLocaleString('zh-CN').replace('-', '')
            }
        },

        // 转换为万元，保留1位小数
        formatToWanYuan: (value: any) => {
            try {
                // 如果输入的是字符串（带千位符），先解析为数字
                let numValue = value;
                if (typeof value === 'string') {
                    // 移除千位符逗号，转换为数字
                    numValue = parseFloat(value.replace(/,/g, ''));
                }

                // 转换为万元（除以10000）
                let wanYuanValue = numValue / 10000;

                // 保留1位小数
                let formattedValue = wanYuanValue.toFixed(1);

                return {
                    value: wanYuanValue,
                    type: 'number',
                    format: formattedValue
                }
            } catch (error) {
                console.error('formatToWanYuan转换失败:', error);
                return {
                    value: 0,
                    type: 'number',
                    format: '0.0'
                }
            }
        },

        // 保留2位小数
        formatToFixed2: (value: any) => {
            try {
                // 如果输入的是字符串，先解析为数字
                let numValue = value;
                if (typeof value === 'string') {
                    numValue = parseFloat(value.replace(/,/g, ''));
                }

                // 转换为数字并保留2位小数
                let numericValue = Number(numValue) || 0;
                let formattedValue = numericValue.toFixed(2);

                return {
                    value: numericValue,
                    type: 'number',
                    format: formattedValue
                }
            } catch (error) {
                console.error('formatToFixed2转换失败:', error);
                return {
                    value: 0,
                    type: 'number',
                    format: '0.00'
                }
            }
        },
    }

    public getFormatFunction(format: string) {
        return this.formatFunctions[format as keyof typeof this.formatFunctions];
    }

    public buildWord() {
        this.generateData(this.getTemplates());

        // 将templates数组转换为字典对象
        const templateData: { [key: string]: string } = {};
        this.templates.forEach(template => {
            templateData[template.tag] = template.value;
        });

        const docx = new Docxtemplater(this.docxZip);
        docx.render(templateData);
        const buf = docx.getZip().generate({ type: 'nodebuffer' });
        fs.writeFileSync(this.outputFilePath, buf);

        this.logger.info('Word文档生成完成', `输出路径: ${this.outputFilePath}`);
    }
}

// 使用示例
if (require.main === module) {
    const engine = new DocxTemplateEngine(projectPath + '/报表说明书/template - 副本.docx', './generated.docx');
    // 1.设置模板规则
    engine.setTemplatesRules([
        {
            varname: '计划比',
            type: 'excel',
            rules: {
                sheetname: '与计划比',
                vOrW: true,
            },
            format: 'formatToChineseNumber'
        },
        {
            varname: '同比',
            type: 'excel',
            rules: {
                sheetname: '与同期比',
                vOrW: true,
            },
            format: 'formatToChineseNumber'
        },
        {
            varname: '利润表',
            type: 'excel',
            rules: {
                sheetname: '利润情况表',
                vOrW: true,
            },
            format: 'formatToChineseNumber'
        },
        {
            varname: '商品销售情况表',
            type: 'excel',
            rules: {
                sheetname: '2025',
                vOrW: true,
            },
            format: 'formatToChineseNumber'
        },
        {
            varname: '外销与收购情况表',
            type: 'excel',
            rules: {
                sheetname: '2025',
                vOrW: true,
            },
            format: 'formatToChineseNumber'
        },
        {
            varname: '其他业务销售明细表',
            type: 'excel',
            rules: {
                sheetname: 'Q其他业务销售明细表',
                vOrW: true,
            },
            format: 'formatToWanYuan'
        },
        {
            varname: '2其他业务销售明细表', // 专门针对C17 F17 I17单元格的格式化
            type: 'excel',
            rules: {
                sheetname: 'Q其他业务销售明细表',
                vOrW: true,
            },
            format: 'formatToFixed2'
        },
        {
            varname: 'dataC',
            type: 'json',
            rules: {
                path: '数据[0].数据A'
            },
            format: 'original'
        },
        {
            varname: '数据B',
            type: 'json',
            rules: {
                path: '数据[0].数据B'
            },
            format: 'original'
        },
        {
            varname: '直接',
            type: 'direct',
            format: 'original'
        },
        {
            varname: '直接2',
            type: 'direct',
            format: 'original'
        }

    ]);


    // 2.加载数据
    engine.loadDataByRule([
        {
            varname: '计划比',
            type: 'excel',
            path: 'E:/projects/docx-template-engine-ts/报表说明书/计划比.xlsx'
        },
        {
            varname: '同比',
            type: 'excel',
            path: 'E:/projects/docx-template-engine-ts/报表说明书/同期比.xlsx'
        },
        {
            varname: '利润表',
            type: 'excel',
            path: 'E:/projects/docx-template-engine-ts/报表说明书/利润表.xlsx'
        },
        {
            varname: '商品销售情况表',
            type: 'excel',
            path: 'E:/projects/docx-template-engine-ts/报表说明书/商品煤销售情况表.xlsx'
        },
        {
            varname: '外销与收购情况表',
            type: 'excel',
            path: 'E:/projects/docx-template-engine-ts/报表说明书/外销与收购情况表.xlsx'
        },
        {
            varname: '其他业务销售明细表',
            type: 'excel',
            path: 'E:/projects/docx-template-engine-ts/报表说明书/其他业务销售明细表.xlsx'
        },
        {
            varname: '2其他业务销售明细表', // 专门针对C17 F17 I17单元格的格式化
            type: 'excel',
            path: 'E:/projects/docx-template-engine-ts/报表说明书/其他业务销售明细表.xlsx'
        },
        {
            varname: 'dataC',
            type: 'json',
            path: 'E:/projects/docx-template-engine-ts/报表说明书/data.json'
        },
        {
            varname: '数据B',
            type: 'json',
            path: 'E:/projects/docx-template-engine-ts/报表说明书/data.json'
        },
        {
            varname: '直接',
            type: 'direct',
            value: '这是直接赋值的数据'
        },
        {
            varname: '直接2',
            type: 'direct',
            value: '这是直接赋值的数据2'
        },

    ]);

    // engine.test("模板{计划比}测试{用户名}结束");


    // 3.测试readJsonData功能


    // console.log('=== 测试JSON数据读取 ===');
    // console.log('数据A:', engine.readData.readJsonData('数据A', '数据[0].数据A'));
    // console.log('数据B:', engine.readData.readJsonData('数据B', '数据[0].数据B'));
    // console.log('数据C:', engine.readData.readJsonData('数据A', '数据[0].数据C')); // 使用数据A读取数据C
    // console.log('不存在的路径:', engine.readData.readJsonData('数据A', '数据[0].不存在'));
    // console.log('直接:', engine.readData.readDirectData('直接'));
    // console.log('直接2:', engine.readData.readDirectData('直接2'));
    // console.log('===== getDataByVarname =====');
    // console.log(engine.getDataByVarname('计划比C2'));

    // console.log('===== detectCommandTag 测试 =====');
    // console.log('$v(参数1,参数2):', engine.detectCommandTag('$v(参数1,参数2)'));
    // console.log('$format(数据A,toPercent):', engine.detectCommandTag('$format(数据A,toPercent)'));
    // console.log('$sum():', engine.detectCommandTag('$sum()'));
    // console.log('普通标签:', engine.detectCommandTag('计划比'));
    // console.log('普通标签:', engine.detectVarname('计划比C2'));
    // console.log(engine.readData.readExcelData('利润表', '利润情况表', 'D4', true));
    //  engine.generateData([
    //     {
    //         tag: '计划比C2'
    //     },
    //     {
    //         tag: '计划比C3'
    //     },
    //     {
    //         tag: '计划比C4'
    //     }
    //  ]);

    // console.log(engine.getTemplates());
    // 使用Logger功能
    // const logger = engine.getLogger();

    // logger.section('模板引擎初始化', '🏗️');
    // engine.debug('这是一个调试消息');
    // engine.debug('这是一个调试消息');
    // engine.debug('这是一个调试消息');
    // engine.debug('这是一个调试消息');

    // logger.section('路径配置', '📂');
    // engine.setOutputPath('./new_output.docx');

    // logger.section('错误处理测试', '⚠️');
    // logger.warn('这是一个警告消息');
    // logger.error('这是一个错误消息');

    // logger.section('日志保存', '💾');
    // // 保存日志到文件
    // logger.saveToFile('./engine-logs.txt').then(success => {
    //     if (success) {
    //         console.log('引擎日志已保存！');
    //     }
    // });
} 