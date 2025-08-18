"""initial migration with admin user"""

from alembic import op
import sqlalchemy as sa
from passlib.context import CryptContext

# revision identifiers
revision = 'init_20250805'
down_revision = None
branch_labels = None
depends_on = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def upgrade():
    # Create tables
    op.create_table('users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(length=50), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=128), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='normal')
    )
    op.create_table('companies',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True)
    )
    op.create_table('pdf_files',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('filename', sa.String(length=200), nullable=False),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id'))
    )
    op.create_table('qa_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id')),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False)
    )

    # Seed admin user
    conn = op.get_bind()
    hashed = pwd_context.hash("password")
    conn.execute(sa.text("INSERT INTO users (username, password_hash, role) VALUES (:u, :p, :r)"),
                 {"u": "admin", "p": hashed, "r": "admin"})

def downgrade():
    op.drop_table('qa_logs')
    op.drop_table('pdf_files')
    op.drop_table('companies')
    op.drop_table('users')
