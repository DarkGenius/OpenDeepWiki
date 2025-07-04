'use client'

import { useState, useEffect } from 'react';
import {
  Typography,
  Layout,
  Card,
  Row,
  Col,
  Space,
  Statistic,
  Empty,
  Spin,
  Avatar,
  Divider,
  Breadcrumb,
  Input,
  theme,
  Descriptions,
  Tag,
  Tooltip,
  Progress,
  List
} from 'antd';
import {
  TeamOutlined,
  GithubOutlined,
  DatabaseOutlined,
  HomeOutlined,
  SearchOutlined,
  CalendarOutlined,
  LinkOutlined,
  GlobalOutlined,
  UserOutlined,
  CodeOutlined,
  HistoryOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { Repository } from '../types';
import { getWarehouse } from '../services/warehouseService';
import RepositoryList from '../components/RepositoryList';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../i18n/client';
const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { useToken } = theme;

export default function OrganizationPage({ params }: any) {
  const { token } = useToken();
  const { t } = useTranslation();
  const pathname = usePathname();
  const pathParts = pathname.split('/').filter(Boolean);
  const owner = pathParts[0] || '';

  // Helper function to safely decode URI components
  const safeDecodeURIComponent = (str: string): string => {
    try {
      return decodeURIComponent(str);
    } catch (error) {
      console.warn('Failed to decode URI component:', str, error);
      return str;
    }
  };

  const [repositories, setRepositories] = useState<Repository[]>([]);
  // const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [total, setTotal] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [orgInfo, setOrgInfo] = useState<any>(null);
  const [orgInfoLoading, setOrgInfoLoading] = useState(true);

  // 尝试获取组织的 GitHub 头像和信息
  useEffect(() => {
    if (owner) {
      setAvatarUrl(`https://github.com/${owner}.png`);
      fetchOrganizationInfo();
    }
  }, [owner]);

  // 加载仓库数据
  useEffect(() => {
    fetchRepositories();
  }, [owner,searchValue]);

  // 过滤仓库
  // useEffect(() => {
  //   if (repositories.length > 0) {
  //     const filtered = repositories.filter(repo =>
  //       repo.name.toLowerCase().includes(searchValue.toLowerCase()) ||
  //       repo.address.toLowerCase().includes(searchValue.toLowerCase())
  //     );
  //     setFilteredRepositories(filtered);
  //   }
  // }, [repositories, searchValue]);

  // 获取组织信息 (通过 GitHub API)
  const fetchOrganizationInfo = async () => {
    setOrgInfoLoading(true);
    try {
      // 尝试获取 GitHub 组织信息
      const response = await fetch(`https://api.github.com/orgs/${owner}`);

      if (response.ok) {
        const data = await response.json();
        setOrgInfo(data);
      } else {
        // 如果不是组织，尝试获取用户信息
        const userResponse = await fetch(`https://api.github.com/users/${owner}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setOrgInfo({
            ...userData,
            isUser: true
          });
        }
      }
    } catch (error) {
      console.error(t('organization.errors.fetch_org_info'), error);
              // 如果获取失败，设置一些默认信息
        setOrgInfo({
          name: owner,
          description: t('organization.description', { name: owner }),
          created_at: null,
          isDefault: true
        });
    } finally {
      setOrgInfoLoading(false);
    }
  };

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      // 这里获取所有仓库然后前端过滤属于该组织的仓库
      // 实际应用中可能需要后端支持按组织过滤的 API
      const response = await getWarehouse(1, 100,searchValue);
      if (response.success && response.data) {
        // 过滤出属于该组织的仓库
        const orgRepos = response.data.items.filter(repo => {
          try {
            const url = new URL(repo.address);
            const repoOwner = url.pathname.split('/')[1];
            return repoOwner.toLowerCase() === owner.toLowerCase();
          } catch (e) {
            // 如果解析失败，尝试从 GitHub URL 解析
            if (repo.address.includes('github.com')) {
              const parts = repo.address.replace('https://github.com/', '').split('/');
              return parts[0].toLowerCase() === owner.toLowerCase();
            }
            return false;
          }
        });

        setRepositories(orgRepos);
        // setFilteredRepositories(orgRepos);
        setTotal(orgRepos.length);
      }
    } catch (error) {
      console.error(t('organization.errors.fetch_repos'), error);
    } finally {
      setLoading(false);
    }
  };

  // 计算统计数据
  const stats = {
    totalRepositories: total,
    gitRepos: repositories.filter(repo => repo.type === 'git').length,
    completedRepos: repositories.filter(repo => repo.status === 2).length,
    lastUpdated: repositories.length ? new Date(
      Math.max(...repositories.map(repo => new Date(repo.updatedAt || repo.createdAt).getTime()))
    ).toLocaleDateString() : '-'
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return t('organization.info.unknown');
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Content style={{ padding: token.padding, background: token.colorBgLayout }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 面包屑导航 */}
        <Breadcrumb
          items={[
            { title: <Link href="/"><HomeOutlined /></Link> },
            { title: safeDecodeURIComponent(owner) }
          ]}
          style={{ marginBottom: token.marginMD }}
        />

        {/* 组织信息卡片 */}
        <Card
          style={{
            borderRadius: token.borderRadiusLG,
            marginBottom: token.marginLG,
            background: token.colorBgContainer
          }}
          loading={orgInfoLoading}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={16}>
              <Space align="start" size={token.marginLG}>
                {avatarUrl && (
                  <Avatar
                    src={avatarUrl}
                    size={64}
                    style={{ border: `1px solid ${token.colorBorderSecondary}` }}
                    icon={<UserOutlined />}
                  />
                )}
                <div>
                  <Space align="center">
                    <Title level={2} style={{ margin: 0, color: token.colorTextHeading }}>
                      {orgInfo?.name || safeDecodeURIComponent(owner)}
                    </Title>
                    <Tag color="blue" icon={orgInfo?.isUser ? <UserOutlined /> : <TeamOutlined />}>
                      {orgInfo?.isUser ? t('organization.tags.personal_user') : t('organization.tags.organization')}
                    </Tag>
                    {!orgInfo?.isDefault && (
                      <Tooltip title={t('organization.tooltips.visit_github')}>
                        <a
                          href={`https://github.com/${owner}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: token.colorPrimary }}
                        >
                          <GithubOutlined style={{ fontSize: token.fontSizeLG }} />
                        </a>
                      </Tooltip>
                    )}
                  </Space>
                  <Paragraph
                    type="secondary"
                    style={{
                      fontSize: token.fontSizeLG,
                      marginTop: token.marginXS,
                      maxWidth: '100%'
                    }}
                  >
                    {orgInfo?.description || t('organization.description', { name: owner })}
                  </Paragraph>
                </div>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic
                    title={<Typography.Text type="secondary">{t('organization.stats.total_repositories')}</Typography.Text>}
                    value={stats.totalRepositories}
                    prefix={<DatabaseOutlined style={{ color: token.colorPrimary }} />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={<Typography.Text type="secondary">{t('organization.stats.git_repos')}</Typography.Text>}
                    value={stats.gitRepos}
                    prefix={<GithubOutlined style={{ color: token.colorPrimary }} />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={<Typography.Text type="secondary">{t('organization.stats.completed_repos')}</Typography.Text>}
                    value={stats.completedRepos}
                    prefix={<CodeOutlined style={{ color: token.colorPrimary }} />}
                  />
                </Col>
              </Row>
            </Col>
          </Row>

          {/* 详细信息部分 */}
          <Divider style={{ margin: `${token.marginMD}px 0` }} />

          <Descriptions
            title={t('organization.info.title')}
            bordered
            column={{ xs: 1, sm: 2, md: 3 }}
            size="small"
            labelStyle={{ width: '120px' }}
          >
            <Descriptions.Item
              label={t('organization.info.created_time')}
              span={1}
            >
              <Space>
                <CalendarOutlined style={{ color: token.colorPrimary }} />
                {orgInfo?.created_at ? formatDate(orgInfo.created_at) : t('organization.info.unknown')}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item
              label={t('organization.info.last_update')}
              span={1}
            >
              <Space>
                <HistoryOutlined style={{ color: token.colorPrimary }} />
                {stats.lastUpdated}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item
              label={t('organization.info.type')}
              span={1}
            >
              <Space>
                {orgInfo?.isUser ? <UserOutlined style={{ color: token.colorPrimary }} /> : <TeamOutlined style={{ color: token.colorPrimary }} />}
                {orgInfo?.isUser ? t('organization.tags.personal_user') : t('organization.tags.organization_account')}
              </Space>
            </Descriptions.Item>

            {orgInfo?.location && (
              <Descriptions.Item label={t('organization.info.location')} span={orgInfo?.blog ? 2 : 3}>
                <Space>
                  <GlobalOutlined style={{ color: token.colorPrimary }} />
                  {orgInfo.location}
                </Space>
              </Descriptions.Item>
            )}

            {orgInfo?.blog && (
              <Descriptions.Item label={t('organization.info.website')} span={orgInfo?.location ? 1 : 3}>
                <Space>
                  <LinkOutlined style={{ color: token.colorPrimary }} />
                  <a href={orgInfo.blog.startsWith('http') ? orgInfo.blog : `https://${orgInfo.blog}`} target="_blank" rel="noopener noreferrer">
                    {orgInfo.blog}
                  </a>
                </Space>
              </Descriptions.Item>
            )}

            {orgInfo?.bio && (
              <Descriptions.Item label={t('organization.info.bio')} span={3}>
                {orgInfo.bio}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* 组织/用户文档 */}
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: token.colorPrimary }} />
              <span>{t('organization.docs.title')}</span>
            </Space>
          }
          style={{
            borderRadius: token.borderRadiusLG,
            marginBottom: token.marginLG,
            background: token.colorBgContainer
          }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={16}>
              <Title level={4}>{t('organization.docs.about_title', { name: orgInfo?.name || safeDecodeURIComponent(owner) })}</Title>
              <Paragraph>
                {orgInfo?.description || orgInfo?.bio || t('organization.default_description', { name: safeDecodeURIComponent(owner) })}
              </Paragraph>

              <Divider style={{ margin: `${token.marginMD}px 0` }} />

              <Title level={4}>{t('organization.docs.quick_links')}</Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => window.open(`https://github.com/${owner}`, '_blank')}
                  >
                                          <Space>
                        <GithubOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                        <div>
                          <Text strong>{t('organization.docs.github_homepage')}</Text>
                          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                            {t('organization.docs.visit_github', { name: safeDecodeURIComponent(owner) })}
                          </Paragraph>
                        </div>
                      </Space>
                  </Card>
                </Col>

                {repositories.length > 0 && (
                  <Col xs={24} sm={12}>
                    <Card
                      size="small"
                      hoverable
                      onClick={() => {
                        const firstRepo = repositories[0];
                        const url = new URL(firstRepo.address);
                        const repoOwner = url.pathname.split('/')[1];
                        const repoName = url.pathname.split('/')[2]?.split('.')[0];
                        if (repoOwner && repoName) {
                          window.location.href = `/${repoOwner}/${repoName}`;
                        }
                      }}
                    >
                                              <Space>
                          <CodeOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                          <div>
                            <Text strong>{t('organization.docs.popular_repo')}</Text>
                            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                              {t('organization.docs.view_latest_docs')}
                            </Paragraph>
                          </div>
                        </Space>
                    </Card>
                  </Col>
                )}
              </Row>

              <Divider style={{ margin: `${token.marginMD}px 0` }} />

              <Title level={4}>{t('organization.docs.usage_guide')}</Title>
              <Paragraph>
                {t('organization.docs.usage_description')}
              </Paragraph>
              <Paragraph>
                {t('organization.docs.doc_includes')}
              </Paragraph>
              <ul>
                <li>
                  <Text strong>{t('organization.docs.code_structure')}</Text> - {t('organization.docs.code_structure_desc')}
                </li>
                <li>
                  <Text strong>{t('organization.docs.api_docs')}</Text> - {t('organization.docs.api_docs_desc')}
                </li>
                <li>
                  <Text strong>{t('organization.docs.implementation')}</Text> - {t('organization.docs.implementation_desc')}
                </li>
                <li>
                  <Text strong>{t('organization.docs.examples')}</Text> - {t('organization.docs.examples_desc')}
                </li>
              </ul>
            </Col>

            <Col xs={24} md={8}>
              <Card
                title={t('organization.sidebar.doc_stats')}
                size="small"
                style={{ marginBottom: token.marginMD }}
              >
                <Statistic
                  title={t('organization.sidebar.total_repos')}
                  value={stats.totalRepositories}
                  prefix={<DatabaseOutlined style={{ color: token.colorPrimary }} />}
                  style={{ marginBottom: token.marginSM }}
                />
                <Statistic
                  title={t('organization.sidebar.completed_docs')}
                  value={stats.completedRepos}
                  prefix={<FileTextOutlined style={{ color: token.colorPrimary }} />}
                  style={{ marginBottom: token.marginSM }}
                />
                <Progress
                  percent={stats.totalRepositories > 0 ? Math.round((stats.completedRepos / stats.totalRepositories) * 100) : 0}
                  status="active"
                />
              </Card>

              {loading ? (
                <Spin />
              ) : repositories.length > 0 ? (
                <Card
                  title={t('organization.sidebar.recent_updates')}
                  size="small"
                >
                  <List
                    size="small"
                    dataSource={repositories.slice(0, 5)}
                    renderItem={(repo) => {
                      // 解析仓库地址获取所有者和名称
                      const getRepoInfo = (address: string) => {
                        try {
                          if (address.includes('github.com')) {
                            const parts = address.replace('https://github.com/', '').split('/');
                            return {
                              owner: parts[0],
                              name: parts[1].split('/')[0].replace('.git', '')
                            };
                          }
                          const url = new URL(address);
                          const owner = url.pathname.split('/')[1];
                          const name = url.pathname.split('/')[2];
                          return {
                            owner: owner,
                            name: name.split('.')[0]
                          };
                        } catch (e) {
                          return { owner: '', name: repo.name };
                        }
                      };

                      const repoInfo = getRepoInfo(repo.address);

                      return (
                        <List.Item>
                          <Link href={`/${repoInfo.owner}/${repoInfo.name}`}>
                            <Space>
                              <Tag color={repo.type === 'git' ? 'blue' : 'green'}>
                                {repo.type === 'git' ? <GithubOutlined /> : <FileTextOutlined />}
                              </Tag>
                              <Text ellipsis style={{ maxWidth: '150px' }}>{repo.name}</Text>
                              <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                                {new Date(repo.updatedAt || repo.createdAt).toLocaleDateString()}
                              </Text>
                            </Space>
                          </Link>
                        </List.Item>
                      );
                    }}
                  />
                </Card>
              ) : null}
            </Col>
          </Row>
        </Card>

        {/* Repository List */}
        <div style={{ marginBottom: token.marginMD }}>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: token.marginMD }}>
            <Title level={3} style={{ margin: 0 }}>{t('organization.repo_list.title')}</Title>
            <Search
              placeholder={t('organization.repo_list.search_placeholder')}
              allowClear
              onSearch={value => setSearchValue(value)}
              onChange={e => setSearchValue(e.target.value)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
          </Space>

          <Divider style={{ margin: `${token.marginSM}px 0` }} />

          {loading ? (
            <div style={{ textAlign: 'center', padding: token.paddingLG }}>
              <Spin size="large" />
            </div>
          ) : repositories.length === 0 ? (
            <Card style={{ background: token.colorBgContainer, borderRadius: token.borderRadiusLG }}>
              <Empty
                description={
                  searchValue ? t('organization.repo_list.not_found', { keyword: searchValue }) : t('organization.repo_list.empty_message', { owner: safeDecodeURIComponent(owner) })
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            <RepositoryList repositories={repositories} />
          )}
        </div>
      </div>
    </Content>
  );
}
