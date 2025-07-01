import { ChatItem } from "@lobehub/ui/chat";
import { GitIssueItem, MessageItem } from "../../../../types/chat";
import { Button, message, Modal, Spin, Tag, Tooltip } from "antd";
import { Collapse, Markdown } from "@lobehub/ui";
import { Copy, MoreHorizontal, Trash2, FileText, Brain, Settings, ChevronDown, ChevronRight, Maximize2, ExternalLink, Calendar, User } from "lucide-react";
import { Flexbox } from "react-layout-kit";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getFileContentByLine } from "../../../../services/warehouseService";

interface AssistantMessageProps {
    messageItem: MessageItem;
    handleDelete: (messageId: string) => void;
    organizationName: string;
    repositoryName: string;
}

export default function AssistantMessage({ messageItem, handleDelete,
    organizationName,
    repositoryName
}: AssistantMessageProps) {
    // 状态管理：跟踪文件内容的展开状态和内容
    const [expandedFiles, setExpandedFiles] = useState<{ [key: string]: boolean }>({});
    const [fileContents, setFileContents] = useState<{ [key: string]: string }>({});
    const [loadingFiles, setLoadingFiles] = useState<{ [key: string]: boolean }>({});

    // 全屏模态框状态
    const [fullScreenFile, setFullScreenFile] = useState<{
        filePath: string;
        content: string;
        language: string;
        startLine: number;
        endLine: number;
    } | null>(null);

    // 根据文件扩展名确定语言类型
    const getLanguageFromFileName = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const languageMap: { [key: string]: string } = {
            'js': 'javascript',
            'jsx': 'jsx',
            'ts': 'typescript',
            'tsx': 'tsx',
            'py': 'python',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cxx': 'cpp',
            'cc': 'cpp',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'kt': 'kotlin',
            'swift': 'swift',
            'scala': 'scala',
            'sh': 'bash',
            'bash': 'bash',
            'zsh': 'zsh',
            'ps1': 'powershell',
            'sql': 'sql',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'less': 'less',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'toml': 'toml',
            'ini': 'ini',
            'cfg': 'ini',
            'conf': 'ini',
            'md': 'markdown',
            'markdown': 'markdown',
            'vue': 'vue',
            'svelte': 'svelte',
            'dockerfile': 'dockerfile',
            'makefile': 'makefile',
            'r': 'r',
            'matlab': 'matlab',
            'm': 'matlab',
            'tex': 'latex',
            'dart': 'dart',
            'lua': 'lua',
            'perl': 'perl',
            'pl': 'perl'
        };
        return languageMap[extension || ''] || 'text';
    };

    // 处理文件内容的获取和展开
    const handleFileClick = async (item: any) => {
        const fileKey = `${item.FilePath}-${item.StartLine}-${item.EndLine}`;

        if (expandedFiles[fileKey]) {
            // 如果已展开，则收起
            setExpandedFiles(prev => ({ ...prev, [fileKey]: false }));
            return;
        }

        // 如果没有内容，则获取内容
        if (!fileContents[fileKey]) {
            setLoadingFiles(prev => ({ ...prev, [fileKey]: true }));
            try {
                const { data } = await getFileContentByLine(
                    organizationName,
                    repositoryName,
                    item.FilePath,
                    item.StartLine,
                    item.EndLine
                );
                setFileContents(prev => ({ ...prev, [fileKey]: data.data || '' }));
            } catch (error) {
                console.error('获取文件内容失败:', error);
                message.error('获取文件内容失败');
                setLoadingFiles(prev => ({ ...prev, [fileKey]: false }));
                return;
            }
            setLoadingFiles(prev => ({ ...prev, [fileKey]: false }));
        }

        // 展开文件内容
        setExpandedFiles(prev => ({ ...prev, [fileKey]: true }));
    };

    // 处理全屏显示
    const handleFullScreen = (item: any, content: string) => {
        const language = getLanguageFromFileName(item.FilePath);
        setFullScreenFile({
            filePath: item.FilePath,
            content: content,
            language: language,
            startLine: item.StartLine,
            endLine: item.EndLine,
        });
    };

    // 关闭全屏模态框
    const handleCloseFullScreen = () => {
        setFullScreenFile(null);
    };

    // 解析Markdown内容，提取thinking代码块
    const parseThinkingBlocks = (content: string) => {
        // 检查是否包含```thinking开头
        const hasThinkingStart = content.includes('```thinking');

        if (!hasThinkingStart) {
            // 没有thinking块，返回正常文本内容
            return [{
                type: 'text',
                content: content
            }];
        }

        // 检查是否有完整的thinking块（包含结束标签）
        const thinkingRegex = /```thinking\n([\s\S]*?)\n```/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        let hasCompleteThinkingBlock = false;

        // 先检查是否有完整的thinking块
        while ((match = thinkingRegex.exec(content)) !== null) {
            hasCompleteThinkingBlock = true;

            // 添加thinking块之前的内容
            if (match.index > lastIndex) {
                const beforeContent = content.slice(lastIndex, match.index).trim();
                if (beforeContent) {
                    parts.push({
                        type: 'text',
                        content: beforeContent
                    });
                }
            }

            // 添加thinking块
            parts.push({
                type: 'thinking',
                content: match[1].trim()
            });

            lastIndex = match.index + match[0].length;
        }

        // 如果有完整的thinking块
        if (hasCompleteThinkingBlock) {
            // 添加最后剩余的内容
            if (lastIndex < content.length) {
                const remainingContent = content.slice(lastIndex).trim();
                if (remainingContent) {
                    parts.push({
                        type: 'text',
                        content: remainingContent
                    });
                }
            }
            return parts;
        }

        // 如果有```thinking开头但没有完整的闭合标签，说明是正在输出的thinking内容
        // 提取```thinking之后的所有内容作为推理内容
        const thinkingStartIndex = content.indexOf('```thinking');
        const beforeThinking = content.slice(0, thinkingStartIndex).trim();
        const thinkingContent = content.slice(thinkingStartIndex + '```thinking'.length).replace(/^\n/, '').trim();

        const result = [];

        // 添加thinking之前的内容
        if (beforeThinking) {
            result.push({
                type: 'text',
                content: beforeThinking
            });
        }

        // 添加正在输出的thinking内容
        if (thinkingContent) {
            result.push({
                type: 'thinking',
                content: thinkingContent
            });
        }

        return result.length > 0 ? result : [{
            type: 'text',
            content: content
        }];
    };

    // 渲染思考组件
    const renderThinkingComponent = (content: string, index: number) => {
        return (<Collapse
            defaultActiveKey={["thinking"]}
            size='small'
            style={{
                marginBottom: 5,
                borderRadius: 8,
            }}
            bordered
            
            items={[
                {
                    key: "thinking",
                    label: (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontWeight: 500,
                        }}>
                            <Brain size={14} />
                            思考过程
                        </div>
                    ),
                    children: (
                        <div style={{
                            maxHeight: 300,
                            overflowY: 'auto',
                            padding: '0 6px 6px',
                        }}>
                            <Markdown
                                fontSize={12}
                                children={content}
                                enableMermaid
                                enableImageGallery
                                enableLatex
                                enableCustomFootnotes
                            />
                        </div>
                    ),
                }
            ]}
        />
        );
    };

    const renderToolCalls = (toolCall: any) => {
        const renderArguments = (type: string) => {
            try {
                const parsedArgs = JSON.parse(toolCall.arguments);
                if (type === 'fileFromLine') {
                    if (parsedArgs.items) {
                        return (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                marginBottom: 5,
                                gap: 8,
                            }}>
                                {parsedArgs.items.map((item: any, index: number) => {
                                    const fileKey = `${item.FilePath}-${item.StartLine}-${item.EndLine}`;
                                    const isExpanded = expandedFiles[fileKey];
                                    const isLoading = loadingFiles[fileKey];
                                    const content = fileContents[fileKey];
                                    const language = getLanguageFromFileName(item.FilePath);


                                    return (
                                        <div key={index} style={{
                                            border: '1px solid #e8e8e8',
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                        }}>
                                            <div
                                                onClick={() => handleFileClick(item)}
                                                style={{
                                                    padding: '8px 12px',
                                                    cursor: 'pointer',
                                                    backgroundColor: isExpanded ? '#f0f7ff' : '#fafafa',
                                                    borderBottom: isExpanded ? '1px solid #e8e8e8' : 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    fontSize: '13px',
                                                    transition: 'all 0.2s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = isExpanded ? '#e6f3ff' : '#f0f0f0';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = isExpanded ? '#f0f7ff' : '#fafafa';
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                }}>
                                                    <FileText size={14} color="#1890ff" />
                                                    <span style={{
                                                        color: '#495057',
                                                        fontWeight: 500,
                                                    }}>
                                                        {item.FilePath}
                                                    </span>
                                                    <span style={{
                                                        color: '#8c8c8c',
                                                        fontSize: '12px',
                                                    }}>
                                                        {item.StartLine} - {item.EndLine} 行
                                                    </span>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}>
                                                    {isLoading && <Spin size="small" />}
                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </div>
                                            </div>
                                            {isExpanded && content && (
                                                <div style={{
                                                    position: 'relative',
                                                    maxHeight: '400px',
                                                    overflowY: 'auto',
                                                    fontSize: '12px',
                                                }}>
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px',
                                                        zIndex: 10,
                                                        display: 'flex',
                                                        gap: '4px',
                                                    }}>
                                                        <Tooltip title="全屏查看">
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<Maximize2 size={14} />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleFullScreen(item, content);
                                                                }}
                                                                style={{
                                                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                                    border: '1px solid #d9d9d9',
                                                                    borderRadius: '4px',
                                                                    padding: '2px 6px',
                                                                    height: '24px',
                                                                    width: '24px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                    <SyntaxHighlighter
                                                        language={language}
                                                        style={vs}
                                                        showLineNumbers={true}
                                                        startingLineNumber={item.StartLine}
                                                        customStyle={{
                                                            margin: 0,
                                                            borderRadius: 0,
                                                            fontSize: '12px',
                                                            lineHeight: '1.4',
                                                        }}
                                                        codeTagProps={{
                                                            style: {
                                                                fontSize: '12px',
                                                                fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                                                            }
                                                        }}
                                                    >
                                                        {content}
                                                    </SyntaxHighlighter>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    }
                } else if (type === 'fileInfo') {
                    if (parsedArgs.filePath && Array.isArray(parsedArgs.filePath)) {
                        return (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                marginBottom: 5,
                                gap: 8,
                            }}>
                                {parsedArgs.filePath.map((path: string, index: number) => (
                                    <div key={index} style={{
                                        border: '1px solid #e8e8e8',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            padding: '8px 12px',
                                            backgroundColor: '#fafafa',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontSize: '13px',
                                        }}>
                                            <FileText size={14} color="#1890ff" />
                                            <span style={{
                                                color: '#495057',
                                                fontWeight: 500,
                                                flex: 1,
                                            }}>
                                                {path}
                                            </span>
                                            <span style={{
                                                color: '#8c8c8c',
                                                fontSize: '12px',
                                            }}>
                                                文件信息
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    }
                } else if (type === 'ragSearch') {
                    return (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                        }}>
                            <span>RAG搜索</span>
                            <pre style={{
                                backgroundColor: '#f8f9fa',
                                padding: '8px',
                                borderRadius: 6,
                                fontSize: '8px',
                                color: '#495057',
                            }}>
                                {toolCall.arguments}
                            </pre>
                        </div>
                    );
                } else if (type === 'githubSearchIssues' || type === 'giteeSearchIssues') {
                    // 处理GitHub或Gitee Issues搜索结果
                    let parsedArgs: any = null;

                    // 首先尝试从 toolResult 中解析数据
                    if (toolCall.toolResult) {
                        try {
                            const resultData = JSON.parse(toolCall.toolResult);
                            if (resultData.GitIssues) {
                                parsedArgs = { GitIssues: resultData.GitIssues };
                            }
                        } catch (error) {
                            console.error('解析 toolResult 失败:', error);
                        }
                    }

                    // 如果 toolResult 中没有数据，则从 arguments 中解析
                    if (!parsedArgs) {
                        try {
                            parsedArgs = JSON.parse(toolCall.arguments);
                        } catch (error) {
                            console.error('解析 arguments 失败:', error);
                        }
                    }

                    if (parsedArgs && parsedArgs.GitIssues && Array.isArray(parsedArgs.GitIssues)) {
                        return (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                maxHeight: '600px',
                                overflowY: 'auto',
                            }}>
                                {parsedArgs.GitIssues.map((issue: GitIssueItem, index: number) => (
                                    <div key={index} style={{
                                        borderRadius: 8,
                                        padding: '12px',
                                        backgroundColor: '#fafafa',
                                        transition: 'all 0.2s ease',
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'space-between',
                                            marginBottom: 8,
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <h4
                                                    onClick={() => window.open(issue.urlHtml, '_blank')}
                                                    style={{
                                                        margin: 0,
                                                        fontSize: '14px',
                                                        fontWeight: 600,
                                                        color: '#1890ff',
                                                        cursor: 'pointer',
                                                        lineHeight: '1.4',
                                                        marginBottom: 4,
                                                    }}>
                                                    {issue.title}
                                                </h4>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    fontSize: '12px',
                                                    color: '#8c8c8c',
                                                    marginBottom: 6,
                                                }}>
                                                    {issue.number && (
                                                        <span style={{
                                                            fontWeight: 500,
                                                            color: '#666',
                                                        }}>
                                                            #{issue.number}
                                                        </span>
                                                    )}
                                                    {issue.state && (
                                                        <Tag
                                                            color={issue.state === 'open' ? 'green' : 'default'}
                                                            style={{
                                                                fontSize: '11px',
                                                                padding: '2px 6px',
                                                                borderRadius: 10,
                                                                lineHeight: '1.2',
                                                            }}
                                                        >
                                                            {issue.state}
                                                        </Tag>
                                                    )}
                                                    {issue.author && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                        }}>
                                                            <User size={12} />
                                                            <span>{issue.author}</span>
                                                        </div>
                                                    )}
                                                    {issue.createdAt && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                        }}>
                                                            <Calendar size={12} />
                                                            <span>
                                                                {new Date(issue.createdAt).toLocaleDateString('zh-CN')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {issue.content && (
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#595959',
                                                lineHeight: '1.5',
                                                backgroundColor: '#ffffff',
                                                padding: '8px',
                                                borderRadius: 4,
                                                border: '1px solid #f0f0f0',
                                                maxHeight: '120px',
                                                overflowY: 'auto',
                                            }}>
                                                {issue.content.length > 200
                                                    ? `${issue.content.substring(0, 200)}...`
                                                    : issue.content
                                                }
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {parsedArgs.GitIssues.length === 0 && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '20px',
                                        color: '#8c8c8c',
                                        fontSize: '12px',
                                    }}>
                                        没有找到相关的Issues
                                    </div>
                                )}
                            </div>
                        );
                    }
                    // 如果不是标准格式，回退到原始显示
                    return (
                        <pre style={{
                            backgroundColor: '#f8f9fa',
                            padding: '8px',
                            borderRadius: 6,
                            fontSize: '8px',
                            color: '#495057',
                            overflow: 'auto',
                            border: '1px solid #e9ecef',
                        }}>
                            {toolCall.arguments}
                        </pre>
                    );
                } else {
                    return (
                        <pre style={{
                            backgroundColor: '#f8f9fa',
                            padding: '8px',
                            borderRadius: 6,
                            fontSize: '8px',
                            color: '#495057',
                            overflow: 'auto',
                            border: '1px solid #e9ecef',
                        }}>
                            {toolCall.arguments}
                        </pre>
                    );
                }
            } catch (error) {
                return (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px',
                    }}>
                        <Spin size="small" />
                        <span style={{ marginLeft: 8, color: '#6c757d' }}>处理中...</span>
                    </div>
                );
            }
        };

        const getToolInfo = (functionName: string) => {
            if (functionName === 'FileFunction-FileFromLine') {
                return { label: '读取文件内容', color: '#52c41a' };
            } else if (functionName === 'FileFunction-FileInfo') {
                return { label: '获取文件信息', color: '#1890ff' };
            }
            else if (functionName === 'RagFunction-RagSearch') {
                return { label: 'RAG搜索', color: '#722ed1' };
            }
            else if (functionName === 'Github-SearchIssues') {
                return { label: 'GitHub Issues搜索', color: '#24292e' };
            }
            else if (functionName === 'Gitee-SearchIssues') {
                return { label: 'Gitee Issues搜索', color: '#c71d23' };
            }
            else {
                return { label: functionName, color: '#722ed1' };
            }
        };

        const toolInfo = getToolInfo(toolCall.functionName);

        let functionType;

        if (toolCall.functionName === 'FileFunction-FileFromLine') {
            functionType = 'fileFromLine';
            return renderArguments(functionType);
        } else if (toolCall.functionName === 'FileFunction-FileInfo') {
            functionType = 'fileInfo';
            return renderArguments(functionType);
        } else if (toolCall.functionName === 'RagFunction-RagSearch') {
            functionType = 'ragSearch';
        } else if (toolCall.functionName === 'Github-SearchIssues') {
            functionType = 'githubSearchIssues';
            return renderArguments(functionType);
        } else if (toolCall.functionName === 'Gitee-SearchIssues') {
            functionType = 'giteeSearchIssues';
            return renderArguments(functionType);
        } else {
            functionType = 'other';
        }


        return (
            <div style={{
                borderRadius: 8,
                overflow: 'hidden',
            }}>
                <Collapse
                    size="small"
                    items={[
                        {
                            key: toolCall.functionName,
                            label: (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    color: toolInfo.color,
                                    fontWeight: 500,
                                }}>
                                    {toolInfo.label}
                                </div>
                            ),
                            children: <Flexbox style={{
                                overflow: 'auto',
                                maxHeight: '180px'
                            }}>
                                {renderArguments(functionType)}
                            </Flexbox>,
                        }
                    ]}
                />
            </div>
        );
    }

    const renderMessage = () => {
        // 从content数组中提取不同类型的内容
        const allContent = messageItem.content as any[];

        return (
            <Flexbox
            >
                {allContent.map((contentItem, index) => {
                    switch (contentItem.type) {
                        case 'reasoning':
                            return (
                                <div key={`reasoning-${index}`} style={{
                                    backgroundColor: '#fff7e6',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                }}>
                                    <Collapse
                                        defaultActiveKey={["thinking"]}
                                        items={[
                                            {
                                                key: "thinking",
                                                label: (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        fontWeight: 500,
                                                    }}>
                                                        推理内容
                                                    </div>
                                                ),
                                                children: (
                                                    <div style={{
                                                        maxHeight: 300,
                                                        overflowY: 'auto',
                                                        padding: '0 6px 6px',
                                                    }}>
                                                        <Markdown
                                                            fontSize={12}
                                                            children={contentItem.content || ''}
                                                            enableMermaid
                                                            enableImageGallery
                                                            enableLatex
                                                            enableCustomFootnotes
                                                        />
                                                    </div>
                                                ),
                                            }
                                        ]}
                                    />
                                </div>
                            );

                        case 'tool':
                            return (
                                <div key={`tool-${index}`}>
                                    {renderToolCalls({
                                        id: contentItem.toolId,
                                        functionName: contentItem.toolName || 'Unknown',
                                        arguments: contentItem.toolArgs || '',
                                        toolResult: contentItem.toolResult || '',
                                    })}
                                </div>
                            );

                        case 'text':
                            return (
                                <div key={`text-${index}`}>
                                    {!contentItem.content || contentItem.content === '' ? (
                                        <div style={{
                                            borderRadius: 8,
                                            padding: '8px',
                                            minHeight: '60px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                color: '#8c8c8c',
                                            }}>
                                                <Spin size="small" />
                                                <span>正在思考中...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {parseThinkingBlocks(contentItem.content).map((part, partIndex) => {
                                                if (part.type === 'thinking') {
                                                    return renderThinkingComponent(part.content, partIndex);
                                                } else {
                                                    return (
                                                        <Markdown
                                                            fontSize={12}
                                                            children={part.content}
                                                            enableMermaid
                                                            enableImageGallery
                                                            enableCustomFootnotes
                                                            enableLatex
                                                        />
                                                    );
                                                }
                                            })}
                                        </>
                                    )}
                                </div>
                            );

                        case 'image':
                            return contentItem.imageContents && contentItem.imageContents.length > 0 ? (
                                <div key={`image-${index}`} style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 8,
                                    marginBottom: 8
                                }}>
                                    {contentItem.imageContents.map((image: any, imgIndex: number) => (
                                        <img
                                            key={imgIndex}
                                            src={`data:${image.mimeType};base64,${image.data}`}
                                            alt="AI生成的图片"
                                            style={{
                                                maxWidth: '200px',
                                                maxHeight: '200px',
                                                borderRadius: '8px',
                                                objectFit: 'contain'
                                            }}
                                            onClick={() => window.open(`data:${image.mimeType};base64,${image.data}`, '_blank')}
                                        />
                                    ))}
                                </div>
                            ) : null;

                        case 'git_issues':
                            return contentItem.gitIssues && contentItem.gitIssues.length > 0 ? (
                                <div key={`git-issues-${index}`} style={{
                                    backgroundColor: '#f6ffed',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    marginBottom: 8,
                                }}>
                                    <Collapse
                                        defaultActiveKey={["git-issues"]}
                                        size="small"
                                        items={[
                                            {
                                                key: "git-issues",
                                                label: (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        fontWeight: 500,
                                                        color: '#52c41a',
                                                    }}>
                                                        <ExternalLink size={16} />
                                                        Issues 搜索结果 ({contentItem.gitIssues.length} 条)
                                                    </div>
                                                ),
                                                children: (
                                                    <div style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 12,
                                                        maxHeight: '600px',
                                                        overflowY: 'auto',
                                                        padding: '0 8px 8px',
                                                    }}>
                                                        {contentItem.gitIssues.map((issue: any, issueIndex: number) => (
                                                            <div key={issueIndex} style={{
                                                                borderRadius: 8,
                                                                padding: '12px',
                                                                transition: 'all 0.2s ease',
                                                            }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'flex-start',
                                                                    justifyContent: 'space-between',
                                                                    marginBottom: 8,
                                                                }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <h4 onClick={() => window.open(issue.urlHtml, '_blank')} style={{
                                                                            margin: 0,
                                                                            fontSize: '14px',
                                                                            fontWeight: 600,
                                                                            color: '#1890ff',
                                                                            cursor: 'pointer',
                                                                            lineHeight: '1.4',
                                                                            marginBottom: 4,
                                                                        }}>
                                                                            {issue.title}
                                                                        </h4>
                                                                        <div style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 12,
                                                                            fontSize: '12px',
                                                                            color: '#8c8c8c',
                                                                            marginBottom: 6,
                                                                        }}>
                                                                            {issue.number && (
                                                                                <span style={{
                                                                                    fontWeight: 500,
                                                                                    color: '#666',
                                                                                }}>
                                                                                    #{issue.number}
                                                                                </span>
                                                                            )}
                                                                            {issue.state && (
                                                                                <Tag
                                                                                    color={issue.state === 'open' ? 'green' : 'default'}
                                                                                    style={{
                                                                                        fontSize: '11px',
                                                                                        padding: '2px 6px',
                                                                                        borderRadius: 10,
                                                                                        lineHeight: '1.2',
                                                                                    }}
                                                                                >
                                                                                    {issue.state}
                                                                                </Tag>
                                                                            )}
                                                                            {issue.author && (
                                                                                <div style={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: 4,
                                                                                }}>
                                                                                    <User size={12} />
                                                                                    <span>{issue.author}</span>
                                                                                </div>
                                                                            )}
                                                                            {issue.createdAt && (
                                                                                <div style={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: 4,
                                                                                }}>
                                                                                    <Calendar size={12} />
                                                                                    <span>
                                                                                        {new Date(issue.createdAt).toLocaleDateString('zh-CN')}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {issue.content && (
                                                                    <div style={{
                                                                        fontSize: '12px',
                                                                        color: '#595959',
                                                                        lineHeight: '1.5',
                                                                        backgroundColor: '#ffffff',
                                                                        padding: '8px',
                                                                        borderRadius: 4,
                                                                        border: '1px solid #f0f0f0',
                                                                        maxHeight: '120px',
                                                                        overflowY: 'auto',
                                                                    }}>
                                                                        {issue.content.length > 200
                                                                            ? `${issue.content.substring(0, 200)}...`
                                                                            : issue.content
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {contentItem.gitIssues.length === 0 && (
                                                            <div style={{
                                                                textAlign: 'center',
                                                                padding: '20px',
                                                                color: '#8c8c8c',
                                                                fontSize: '12px',
                                                            }}>
                                                                没有找到相关的Issues
                                                            </div>
                                                        )}
                                                    </div>
                                                ),
                                            }
                                        ]}
                                    />
                                </div>
                            ) : null;

                        default:
                            return (
                                <div key={`other-${index}`} style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: 8,
                                    padding: '12px',
                                    color: '#6c757d',
                                    fontSize: '12px'
                                }}>
                                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                                        未知内容类型: {contentItem.type}
                                    </div>
                                    <pre style={{ margin: 0, fontFamily: 'inherit' }}>
                                        {JSON.stringify(contentItem, null, 2)}
                                    </pre>
                                </div>
                            );
                    }
                })}
            </Flexbox>
        )
    }

    const handleDeleteClick = () => {
        Modal.confirm({
            title: '确定删除该消息吗？',
            content: '删除后将无法恢复',
            okText: '确定删除',
            cancelText: '取消',
            okType: 'danger',
            onOk: () => {
                handleDelete(messageItem.id);
            }
        });
    }

    const handleCopyClick = () => {
        // 提取所有文本和推理内容进行复制
        const allContent = messageItem.content as any[];
        const textContent = allContent
            .filter(item => item.type === 'text' || item.type === 'reasoning')
            .map(item => item.content || '')
            .join('\n\n');
        navigator.clipboard.writeText(textContent);
        message.success('已复制到剪贴板');
    }

    const renderActions = () => {
        return (
            <Flexbox
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                }}
            >
                <Tooltip title="复制回复内容">
                    <Button
                        size="small"
                        type="text"
                        onClick={handleCopyClick}
                        style={{
                            color: '#8c8c8c',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#1890ff';
                            e.currentTarget.style.backgroundColor = '#f0f8ff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#8c8c8c';
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <Copy size={14} />
                    </Button>
                </Tooltip>
                <Tooltip title="删除消息">
                    <Button
                        size="small"
                        type="text"
                        onClick={handleDeleteClick}
                        style={{
                            color: '#8c8c8c',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ff4d4f';
                            e.currentTarget.style.backgroundColor = '#fff2f0';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#8c8c8c';
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <Trash2 size={14} />
                    </Button>
                </Tooltip>
            </Flexbox>
        )
    }

    return (
        <>
            <ChatItem
                avatar={{
                    avatar: "🤖",
                    title: "AI助手",
                }}
                actions={renderActions()}
                renderMessage={renderMessage}
                key={messageItem.id}
                style={{
                    marginBottom: 16,
                }}
            />

            <Modal
                zIndex={1002}
                title={
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '16px',
                        fontWeight: 500,
                    }}>
                        <FileText size={18} />
                        <span>{fullScreenFile?.filePath}</span>
                        <span style={{
                            color: '#8c8c8c',
                            fontSize: '14px',
                            fontWeight: 400,
                        }}>
                            ({fullScreenFile?.startLine} - {fullScreenFile?.endLine} 行)
                        </span>
                    </div>
                }
                open={!!fullScreenFile}
                onCancel={handleCloseFullScreen}
                footer={null}
                width="90vw"
                centered
                style={{
                    maxHeight: '90vh',
                }}
                bodyStyle={{
                    padding: 0,
                    maxHeight: '80vh',
                    overflow: 'hidden',
                }}
            >
                {fullScreenFile && (
                    <div style={{
                        height: '80vh',
                        overflow: 'auto',
                    }}>
                        <SyntaxHighlighter
                            language={fullScreenFile.language}
                            style={vs}
                            showLineNumbers={true}
                            startingLineNumber={fullScreenFile.startLine}
                            customStyle={{
                                margin: 0,
                                borderRadius: 0,
                                fontSize: '14px',
                                lineHeight: '1.5',
                                height: '100%',
                                overflow: 'auto',
                            }}
                            codeTagProps={{
                                style: {
                                    fontSize: '14px',
                                    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                                }
                            }}
                        >
                            {fullScreenFile.content}
                        </SyntaxHighlighter>
                    </div>
                )}
            </Modal>
        </>
    )
}