import { ChatItem } from "@lobehub/ui/chat";
import { Button, message, Modal } from "antd";
import { Copy, Trash2 } from "lucide-react";
import { Flexbox } from "react-layout-kit";
import { Markdown } from "@lobehub/ui";
import { Base64Content, MessageContentAudioItem, MessageContentCodeItem, MessageContentFileItem, MessageContentImageItem, MessageContentItem, MessageContentLinkItem, MessageContentReasoningItem, MessageContentTableItem, MessageContentTextItem, MessageContentToolItem, MessageContentType, MessageItem } from "../../../../types/chat";

interface UserMessageProps {
    messageItem: MessageItem;
    handleDelete: (messageId: string) => void;
}

export default function UserMessage({ messageItem, handleDelete }: UserMessageProps) {
    const handleDeleteClick = () => {
        Modal.confirm({
            title: '确定删除该消息吗？',
            onOk: () => {
                handleDelete(messageItem.id);
            }
        });
    }

    const handleCopyClick = () => {
        // 提取所有文本和推理内容
        const textContent = (messageItem.content as any[])
            .filter(item => item.type === 'text' || item.type === 'reasoning')
            .map(item => item.content || '')
            .join('\n\n');
        navigator.clipboard.writeText(textContent);
        message.success('已复制到剪贴板');
    }

    const renderActions = () => {
        return (
            <Flexbox
                gap={8}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Button
                    type="text"
                    onClick={handleDeleteClick}
                    size="small"
                >
                    <Trash2
                        color="red"
                        size={16}
                    />
                </Button>
                <Button
                    type="text"
                    onClick={handleCopyClick}
                    size="small"
                >
                    <Copy
                        size={16}
                    />
                </Button>
            </Flexbox>
        )
    }

    const renderMessage = () => {
        return (
            <div style={{
                maxHeight: 230,
                overflowY: 'auto',
                overflowX: 'hidden',
                fontSize: 12,
            }}>
                {(messageItem.content as any[]).map((contentItem: MessageContentToolItem | MessageContentImageItem | MessageContentCodeItem | MessageContentTableItem | MessageContentLinkItem | MessageContentFileItem | MessageContentAudioItem | MessageContentReasoningItem | MessageContentTextItem, index: number) => {
                    switch (contentItem.type) {
                        case MessageContentType.Text:
                            return (
                                <div key={`text-${index}`} style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontSize: 12,
                                }}>
                                    {contentItem.content || ''}
                                </div>
                            );
                        case MessageContentType.Image:
                            return contentItem.imageContents && contentItem.imageContents.length > 0 ? (
                                <div key={`image-${index}`} style={{ marginBottom: '8px' }}>
                                    {contentItem.imageContents.map((image: Base64Content, imgIndex: number) => (
                                        <img
                                            key={imgIndex}
                                            src={`data:${image.mimeType};base64,${image.data}`}
                                            alt="用户上传的图片"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '150px',
                                                borderRadius: '4px',
                                                marginRight: '8px'
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : null;
                        default:
                            return (
                                <div key={`other-${index}`}>
                                    暂时不支持该类型
                                </div>
                            );
                    }
                })}
            </div>
        )
    }

    return (
        <ChatItem
            avatar={{
                avatar: "😁",
                title: "用户",
            }}
            actions={renderActions()}
            key={messageItem.id}
            renderMessage={renderMessage}
        />
    )
}