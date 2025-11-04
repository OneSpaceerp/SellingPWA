import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type Visit } from '../services/apiService';
import { authService } from '../services/authService';
import { notifications } from '@mantine/notifications';
import {
  Title,
  TextInput,
  Button,
  Card,
  Group,
  Stack,
  Text,
  SimpleGrid,
  Badge,
  Loader,
  Center,
  ActionIcon,
  Modal,
  ScrollArea,
  Divider,
} from '@mantine/core';
import { IconCalendar, IconPlus, IconSearch, IconEye, IconPackage, IconMessage } from '@tabler/icons-react';

export function ServicePlanPage() {
  const navigate = useNavigate();
  const seller = authService.getLoggedInUser();

  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    if (seller) {
      loadVisits();
    }
  }, [seller]);

  const loadVisits = async () => {
    if (!seller) return;
    
    setIsLoading(true);
    try {
      const data = await apiService.getVisits(seller);
      // Sort by visit date (newest first)
      const sortedData = data.sort((a, b) => 
        new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
      );
      setVisits(sortedData);
    } catch (error) {
      console.error('Error loading visits:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load visits. Please try again.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewVisit = async (visit: Visit) => {
    if (visit.name) {
      try {
        const fullVisit = await apiService.getVisit(visit.name);
        setSelectedVisit(fullVisit);
        setViewModalOpen(true);
      } catch (error) {
        console.error('Error loading visit details:', error);
        setSelectedVisit(visit);
        setViewModalOpen(true);
      }
    } else {
      setSelectedVisit(visit);
      setViewModalOpen(true);
    }
  };

  const filteredVisits = visits.filter(visit =>
    visit.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visit.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visit.visit_comments?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Center style={{ minHeight: '50vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div style={{
      padding: '0',
      width: '100%',
      margin: 0,
      background: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '16px',
        margin: '0.06rem',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <Group align="center" justify="space-between">
          <Group align="center" gap="md">
            <IconCalendar size={32} />
            <div>
              <Title order={1} c="white" mb="xs">Service Plan</Title>
              <Text c="white" size="sm" opacity={0.9}>
                Manage customer visits and track service activities
              </Text>
            </div>
          </Group>
          <Button
            onClick={() => navigate('/new-visit')}
            leftSection={<IconPlus size={16} />}
            size="md"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
            }}
          >
            New Visit
          </Button>
        </Group>
      </div>

      <div style={{ margin: '0.06rem', padding: '0.06rem' }}>
        {/* Search */}
        <Card style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef'
        }}>
          <TextInput
            placeholder="Search visits by customer name or comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size={16} />}
            size="md"
          />
        </Card>

        {/* Visits List */}
        {filteredVisits.length === 0 ? (
          <Card style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <IconCalendar size={48} color="#ccc" style={{ margin: '0 auto 16px' }} />
            <Text size="lg" c="dimmed" mb="md">
              {searchQuery ? 'No visits found matching your search' : 'No visits recorded yet'}
            </Text>
            {!searchQuery && (
              <Button
                onClick={() => navigate('/new-visit')}
                leftSection={<IconPlus size={16} />}
                size="md"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                }}
              >
                Create Your First Visit
              </Button>
            )}
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {filteredVisits.map((visit) => (
              <Card
                key={visit.name || visit.visit_date}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                  border: '1px solid #e9ecef',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onClick={() => handleViewVisit(visit)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
                }}
              >
                <Group justify="space-between" mb="sm">
                  <Text fw={600} size="lg" c="#495057">
                    {visit.customer_name || visit.customer}
                  </Text>
                  <ActionIcon
                    variant="light"
                    color="blue"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewVisit(visit);
                    }}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                </Group>

                <Stack gap="xs">
                  <Group gap="xs">
                    <IconCalendar size={14} color="#667eea" />
                    <Text size="sm" c="dimmed">
                      {new Date(visit.visit_date).toLocaleDateString()}
                    </Text>
                  </Group>

                  {visit.status && (
                    <Badge
                      color={visit.status === 'Completed' ? 'green' : 'blue'}
                      variant="light"
                      size="sm"
                      style={{ width: 'fit-content' }}
                    >
                      {visit.status}
                    </Badge>
                  )}

                  {visit.visit_comments && (
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {visit.visit_comments}
                    </Text>
                  )}

                  {visit.samples && visit.samples.length > 0 && (
                    <Group gap="xs" mt="xs">
                      <IconPackage size={14} color="#667eea" />
                      <Text size="sm" c="dimmed">
                        {visit.samples.length} sample(s) provided
                      </Text>
                    </Group>
                  )}
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </div>

      {/* View Visit Modal */}
      <Modal
        opened={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Visit Details"
        size="lg"
      >
        {selectedVisit && (
          <ScrollArea h={500}>
            <Stack gap="md">
              <div>
                <Text size="sm" c="dimmed">Customer</Text>
                <Text fw={500} size="md">{selectedVisit.customer_name || selectedVisit.customer}</Text>
              </div>

              <div>
                <Text size="sm" c="dimmed">Visit Date</Text>
                <Text fw={500} size="md">
                  {new Date(selectedVisit.visit_date).toLocaleDateString()}
                </Text>
              </div>

              {selectedVisit.status && (
                <div>
                  <Text size="sm" c="dimmed">Status</Text>
                  <Badge
                    color={selectedVisit.status === 'Completed' ? 'green' : 'blue'}
                    variant="light"
                    size="lg"
                  >
                    {selectedVisit.status}
                  </Badge>
                </div>
              )}

              <Divider />

              {selectedVisit.visit_comments && (
                <div>
                  <Group gap="xs" mb="xs">
                    <IconMessage size={16} color="#667eea" />
                    <Text fw={600} size="md">Visit Comments</Text>
                  </Group>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedVisit.visit_comments}
                  </Text>
                </div>
              )}

              {selectedVisit.customer_feedback && (
                <div>
                  <Group gap="xs" mb="xs">
                    <IconMessage size={16} color="#667eea" />
                    <Text fw={600} size="md">Customer Feedback</Text>
                  </Group>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedVisit.customer_feedback}
                  </Text>
                </div>
              )}

              {selectedVisit.samples && selectedVisit.samples.length > 0 && (
                <div>
                  <Group gap="xs" mb="xs">
                    <IconPackage size={16} color="#667eea" />
                    <Text fw={600} size="md">Samples Provided</Text>
                  </Group>
                  <Stack gap="xs">
                    {selectedVisit.samples.map((sample, index) => (
                      <Card key={index} withBorder p="sm">
                        <Group justify="space-between">
                          <Text size="sm" fw={500}>
                            {sample.item_name || sample.item_code}
                          </Text>
                          <Badge variant="light" color="blue">
                            Qty: {sample.qty} {sample.uom || 'Nos'}
                          </Badge>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </div>
              )}
            </Stack>
          </ScrollArea>
        )}
      </Modal>
    </div>
  );
}
