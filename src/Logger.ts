import * as fs from 'fs';
import * as path from 'path';

/**
 * 日志级别枚举
 */
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

/**
 * 日志记录接口
 */
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
}

/**
 * 简单实用的调试输出工具类
 */
export class Logger {
    private logs: LogEntry[] = [];
    private maxLogs: number;
    private context: string;

    /**
     * 构造函数
     * @param context 日志上下文标识
     * @param maxLogs 最大日志记录数量，超过会删除最老的记录
     */
    constructor(context: string = 'App', maxLogs: number = 1000) {
        this.context = context;
        this.maxLogs = maxLogs;
    }

    /**
     * 添加日志记录
     * @param level 日志级别
     * @param message 日志消息
     * @param context 可选的上下文信息
     */
    private addLog(level: LogLevel, message: string, context?: string): void {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: context || this.context
        };

        this.logs.push(logEntry);

        // 如果超过最大记录数，删除最老的记录
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // 同时输出到控制台
        this.outputToConsole(logEntry);
    }

    /**
     * 获取日志级别对应的表情符号
     * @param level 日志级别
     * @returns 表情符号
     */
    private getLevelEmoji(level: LogLevel): string {
        switch (level) {
            case LogLevel.DEBUG:
                return '🐛 ';
            case LogLevel.INFO:
                return 'ℹ️ ';
            case LogLevel.WARN:
                return '⚠️ ';
            case LogLevel.ERROR:
                return '❌ ';
            default:
                return '';
        }
    }

    /**
     * 输出到控制台
     * @param logEntry 日志条目
     */
    private outputToConsole(logEntry: LogEntry): void {
        const emoji = this.getLevelEmoji(logEntry.level);
        const formattedMessage = `[${logEntry.timestamp}] [${emoji}${logEntry.level}] [${logEntry.context}] ${logEntry.message}`;
        
        switch (logEntry.level) {
            case LogLevel.DEBUG:
                console.debug(formattedMessage);
                break;
            case LogLevel.INFO:
                console.info(formattedMessage);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage);
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage);
                break;
        }
    }

    /**
     * 记录调试信息
     * @param message 调试消息
     * @param context 可选上下文
     */
    public debug(message: string, context?: string): void {
        this.addLog(LogLevel.DEBUG, message, context);
    }

    /**
     * 记录一般信息
     * @param message 信息消息
     * @param context 可选上下文
     */
    public info(message: string, context?: string): void {
        this.addLog(LogLevel.INFO, message, context);
    }

    /**
     * 记录警告信息
     * @param message 警告消息
     * @param context 可选上下文
     */
    public warn(message: string, context?: string): void {
        this.addLog(LogLevel.WARN, message, context);
    }

    /**
     * 记录错误信息
     * @param message 错误消息
     * @param context 可选上下文
     */
    public error(message: string, context?: string): void {
        this.addLog(LogLevel.ERROR, message, context);
    }

    /**
     * 插入分隔标题，用于在日志中标记不同的操作阶段或模块
     * @param title 分隔标题
     * @param emoji 可选的表情符号，默认为 ✅
     */
    public section(title: string, emoji: string = '✅'): void {
        const separator = `=== ${emoji} ${title} ===`;
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: separator,
            context: this.context
        };

        this.logs.push(logEntry);

        // 如果超过最大记录数，删除最老的记录
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // 直接输出分隔符到控制台（不使用标准格式）
        console.log(`\n${separator}\n`);
    }

    /**
     * 获取所有日志记录
     * @returns 日志记录数组
     */
    public getLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * 根据级别过滤日志
     * @param level 日志级别
     * @returns 过滤后的日志记录
     */
    public getLogsByLevel(level: LogLevel): LogEntry[] {
        return this.logs.filter(log => log.level === level);
    }

    /**
     * 清空所有日志记录
     */
    public clearLogs(): void {
        this.logs = [];
        this.info('日志记录已清空');
    }

    /**
     * 将日志保存为txt文件
     * @param filePath 保存的文件路径，默认为当前目录下的logs.txt
     * @param includeLevel 可选的日志级别过滤，如果不指定则保存所有日志
     * @returns 保存是否成功
     */
    public async saveToFile(filePath: string = './logs.txt', includeLevel?: LogLevel): Promise<boolean> {
        try {
            // 获取要保存的日志
            const logsToSave = includeLevel 
                ? this.getLogsByLevel(includeLevel)
                : this.getLogs();

            if (logsToSave.length === 0) {
                this.warn('没有日志记录可保存');
                return false;
            }

            // 格式化日志内容
            const logContent = this.formatLogsForFile(logsToSave);

            // 确保目录存在
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // 写入文件
            await fs.promises.writeFile(filePath, logContent, 'utf-8');
            
            this.info(`日志已保存到文件: ${filePath}, 共 ${logsToSave.length} 条记录`);
            return true;

        } catch (error) {
            this.error(`保存日志文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
            return false;
        }
    }

    /**
     * 格式化日志内容用于文件保存
     * @param logs 日志记录数组
     * @returns 格式化后的字符串
     */
    private formatLogsForFile(logs: LogEntry[]): string {
        const header = `=== 📋 日志记录文件 ===\n生成时间: ${new Date().toLocaleString()}\n总记录数: ${logs.length}\n\n`;
        
        const logLines = logs.map(log => {
            const emoji = this.getLevelEmoji(log.level);
            return `[${log.timestamp}] [${emoji}${log.level}] [${log.context}] ${log.message}`;
        }).join('\n');

        const footer = `\n\n=== ✅ 日志记录结束 ===`;

        return header + logLines + footer;
    }

    /**
     * 获取日志统计信息
     * @returns 各级别日志的数量统计
     */
    public getLogStats(): Record<LogLevel, number> {
        const stats: Record<LogLevel, number> = {
            [LogLevel.DEBUG]: 0,
            [LogLevel.INFO]: 0,
            [LogLevel.WARN]: 0,
            [LogLevel.ERROR]: 0
        };

        this.logs.forEach(log => {
            stats[log.level]++;
        });

        return stats;
    }
}

// 使用示例
if (require.main === module) {
    const logger = new Logger('测试应用');
    
    logger.section('应用程序初始化', '🚀');
    logger.info('应用程序启动');
    logger.debug('调试信息: 初始化完成');
    
    logger.section('配置加载模块', '⚙️');
    logger.warn('警告: 配置文件未找到，使用默认配置');
    logger.info('配置加载完成');
    
    logger.section('数据库连接模块', '💾');
    logger.error('错误: 数据库连接失败');
    logger.info('尝试重新连接...');
    
    logger.section('文件处理模块', '📁');
    logger.info('开始处理文件');
    logger.debug('文件路径验证通过');
    
    // 保存日志到文件
    logger.saveToFile('./test-logs.txt').then(success => {
        if (success) {
            console.log('日志保存成功！');
        }
    });
} 